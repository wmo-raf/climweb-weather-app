import { DateTime } from 'luxon'
import { parseString } from 'xml2js';
import Axios, { AxiosRequestConfig, HttpStatusCode } from 'axios';

import { createPolicy } from '@/lib/http/resilience';
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

// Shared by both the primary and fallback fetches — a plain, unconditional
// request unless extraHeaders adds something like If-Modified-Since (only
// the primary ever passes that).
function buildRequestConfig(extraHeaders?: Record<string, string>): AxiosRequestConfig {
  return {
    headers: { 'User-Agent': APP_USER_AGENT, ...extraHeaders },
    responseType: 'text',
    timeout: 5_000,
  };
}

// 304 handling lives here, scoped to the primary only: a 304 is only ever a
// valid response to a *conditional* request (one carrying If-Modified-Since
// or similar), which only the primary ever sends (see download() below).
// Axios's default validateStatus only treats 2xx as success, so without
// this override a 304 would reject the promise before it could be
// recognized as "no changes" rather than a failure.
async function fetchPrimaryFeed(url: string, config: AxiosRequestConfig): Promise<string | null> {
  const response = await Axios.get(url, {
    ...config,
    validateStatus: (status) => (status >= 200 && status < 300) || status === HttpStatusCode.NotModified,
  });
  return response.status === HttpStatusCode.NotModified ? null : response.data;
}

// Retries the primary feed up to 3 times (through the breaker, so each
// attempt counts toward tripping it), then falls back to
// FALLBACK_ALERTS_URL once both are exhausted. See lib/http/resilience.ts.
// The primary's If-Modified-Since reflects the primary resource's history,
// not the fallback's — reusing it here isn't meaningful, so the fallback
// gets its own plain, unconditional request, and whatever it returns is
// taken as-is: since this request carries no conditional header
const resilience = createPolicy('Primary Alerts Feed')
  .withFallback(async () => {
    console.warn('🚨 [fallback] Falling back to secondary alerts feed...');
    const response = await Axios.get(FALLBACK_ALERTS_URL, buildRequestConfig());
    console.log('✅ [fallback] Secondary alerts feed request succeeded');
    return response.data;
  })
  .withRetry()
  .withBreaker()
  .compose();

/**
 * Downloads the CAP RSS feed at `url`, conditionally (via `If-Modified-Since`)
 * if `ifModifiedSince` is given. Retries the primary up to 3 times
 * (breaker-guarded — 3 consecutive failures trips the breaker, so once
 * tripped, further attempts within the retry fail fast instead of hitting
 * a known-down host) before falling back to `FALLBACK_ALERTS_URL`. If the
 * fallback also fails, the error propagates. Returns `null` for a 304 from
 * the primary (no changes since `ifModifiedSince`) — the fallback is always
 * unconditional and never produces one.
 */
async function download(url: string, ifModifiedSince?: DateTime): Promise<string | null> {
  const config = buildRequestConfig(
    ifModifiedSince ? { 'If-Modified-Since': ifModifiedSince.toHTTP()! } : undefined
  );

  return resilience.execute(async () => {
    const data = await fetchPrimaryFeed(url, config);
    if (data === null) {
      console.log(`Alerts feed from ${url} has not been modified since ${ifModifiedSince}. Returning null...`);
    } else {
      console.info('✅ Successfully got response from primary alerts feed.');
    }
    return data;
  });
}

function parseRssFeed(doc: string): CAPReference[] | PromiseLike<CAPReference[]> {
  return new Promise((resolve, reject) => {
    parseString(doc, (err: Error | null, result: any) => {
      if (err != null) {
        reject(err);
        return;
      }
      let ret: CAPReference[] = [];

      for (const item of result.rss.channel[0].item ?? []) {
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
