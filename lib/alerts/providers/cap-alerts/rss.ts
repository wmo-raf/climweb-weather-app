import { DateTime } from 'luxon'
import { parseString } from 'xml2js';
import Axios, { AxiosRequestConfig, HttpStatusCode } from 'axios';

import {
  ConsecutiveBreaker,
  ExponentialBackoff,
  handleAll,
  circuitBreaker,
  retry,
  wrap,
  CircuitBreakerPolicy,
} from 'cockatiel';

import { PRIMARY_ALERTS_URL, FALLBACK_ALERTS_URL, APP_USER_AGENT } from '@/config';

/**
 * A reference to a CAP message.
 */
export interface CAPReference {
  title: string
  link: string
  guid: string
  pubDate: DateTime
}

function initBreaker(breaker: CircuitBreakerPolicy): void {
  breaker.onBreak(() => {
    console.warn('💥 Breaker tripped after consecutive failures');
  });

  breaker.onReset(() => {
    console.log('✅ Breaker reset — primary API re-enabled');
  });

  breaker.onStateChange((state) => {
    console.info(`⚡ Breaker state changed to: ${state}`);
  });
}

// Stop calling the executed function for 15 seconds if it fails 3 times in a row
const breakerPolicy = circuitBreaker(handleAll, {
  halfOpenAfter: 15_000,
  breaker: new ConsecutiveBreaker(3),
});
initBreaker(breakerPolicy);

// Retries the primary feed up to 3 times (through the breaker above, so
// each attempt counts toward tripping it) before giving up on it —
// download()'s catch block then falls back to the secondary feed. Mirrors
// cockatiel's own retry+breaker composition example.
const retryPolicy = retry(handleAll, { maxAttempts: 3, backoff: new ExponentialBackoff() });
const resiliencePolicy = wrap(retryPolicy, breakerPolicy);

function errorMessage(error: unknown): string {
  if (Axios.isAxiosError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Downloads the CAP RSS feed at `url`, conditionally (via `If-Modified-Since`)
 * if `ifModifiedSince` is given. Retries the primary up to 3 times
 * (breaker-guarded — 3 consecutive failures trips the breaker, so once
 * tripped, further attempts within the retry fail fast instead of hitting
 * a known-down host) before falling back to `FALLBACK_ALERTS_URL`. If the
 * fallback also fails, the error propagates. Returns `null` for a 304 (no
 * changes since `ifModifiedSince`).
 */
async function download(url: string, ifModifiedSince?: DateTime): Promise<string | null> {
  const headers: Record<string, string> = { 'User-Agent': APP_USER_AGENT };
  if (ifModifiedSince) headers['If-Modified-Since'] = ifModifiedSince.toHTTP()!;

  const config: AxiosRequestConfig = {
    headers,
    responseType: 'text',
    // Axios's default validateStatus only treats 2xx as success, so a 304
    // (expected and handled explicitly below) would otherwise reject the
    // promise before the status check ever runs.
    validateStatus: (status) => (status >= 200 && status < 300) || status === HttpStatusCode.NotModified,
  };

  try {
    console.log(`Querying primary alerts feed alerts with breaker in state ${breakerPolicy.state}...`);
    const response = await resiliencePolicy.execute(() => Axios.get(url, config));
    console.log('✅ Successfully got response from primary alerts feed.');

    if (response.status === HttpStatusCode.NotModified) {
      console.log(`Alerts feed from ${url} has not been modified since ${ifModifiedSince}. Returning null...`);
      return null;
    }

    return response.data;
  } catch (error) {
    // Only reached once resiliencePolicy has given up — all 3 retry
    // attempts against the primary failed (or failed fast, breaker-open).
    console.warn('⚠️ Primary alerts feed failed after retries:', errorMessage(error));
    console.warn('🚨 Falling back to secondary alerts feed...');
    try {
      // The primary's If-Modified-Since reflects the primary resource's
      // history, not the fallback's — reusing it here isn't meaningful, so
      // the fallback gets its own plain, unconditional config.
      const fallbackConfig: AxiosRequestConfig = {
        headers: { 'User-Agent': APP_USER_AGENT },
        responseType: 'text',
      };
      const response = await Axios.get(FALLBACK_ALERTS_URL, fallbackConfig);
      return response.data;
    } catch (fallbackError) {
      console.warn('⚠️ Fallback alerts feed also failed:', errorMessage(fallbackError));
      throw fallbackError;
    }
  }
}

/**
 * Reads the primary CAP RSS feed, but does nothing if it has not been
 * modified since the given time.
 * @param ifModifiedSince
 * @returns A list of CAPReference objects, or null if no changes have been made.
 */
export async function readCapFeedIfModified(ifModifiedSince: DateTime): Promise<CAPReference[] | null> {
  const doc = await download(PRIMARY_ALERTS_URL, ifModifiedSince)
  if (!doc) {
    return null
  }
  return parseRssFeed(doc)
}

function parseRssFeed(doc: string): CAPReference[] | PromiseLike<CAPReference[]> {
  return new Promise((resolve, reject) => {
    parseString(doc, (err: Error | null, result: any) => {
      if (err != null) {
        reject(err);
        return;
      }
      let ret: CAPReference[] = [];

      for (const item of result.rss.channel[0].item) {
        ret.push({
          title: item.title[0],
          link: item.link[0],
          guid: item.guid[0],
          pubDate: DateTime.fromRFC2822(item.pubDate[0])
        });
      }
      resolve(ret);
    });
  });
}
