import { DateTime } from 'luxon'
import { parseString } from 'xml2js';
import Axios, { AxiosRequestConfig, HttpStatusCode } from 'axios';

import {
  ConsecutiveBreaker,
  ExponentialBackoff,
  IPolicy,
  circuitBreaker,
  fallback,
  handleAll,
  retry,
  wrap,
} from 'cockatiel';

import { APP_USER_AGENT } from '@/config';
import { DEFAULT_LANGUAGE, LANGUAGES } from '@/lib/localization/translations';
import { baseLanguage } from './alert';

/**
 * A reference to a CAP message.
 */
export interface CAPReference {
  title: string
  link: string
  guid: string
  pubDate: DateTime
}

/**
 * A CAP RSS feed: where to read it, where to go if that's down, and whose
 * messages to accept from it.
 */
export interface AlertsFeed {
  primary: string
  // Empty when the language has no fallback feed.
  fallback: string
  // <sender> whose messages are shown (from either feed). Agencies can use
  // a different sender per feed, e.g. TMA's English and Swahili feeds.
  senderId: string
}

/**
 * The CAP feed for an app language: its language file's cap_feed_url,
 * fallback_cap_feed_url and cap_sender_id (lib/localization/translations).
 * A language without a feed of its own (empty cap_feed_url, or no language
 * file) uses the default language's. Null when there's no feed at all,
 * meaning no alerts.
 */
export function alertsFeed(language: string): AlertsFeed | null {
  const own = LANGUAGES[baseLanguage(language)];
  const config = own?.capFeedUrl ? own : LANGUAGES[DEFAULT_LANGUAGE];
  if (!config?.capFeedUrl) return null;
  return {
    primary: config.capFeedUrl,
    fallback: config.fallbackCapFeedUrl,
    senderId: config.capSenderId,
  };
}

/**
 * How a feed is read: the primary URL is retried up to `retries` times with
 * exponential backoff. If that still fails, the circuit opens and requests
 * go straight to the fallback URL for `openFor` ms; after that the primary
 * is tried again, and the circuit closes once it answers.
 */
export const FEED_POLICY = {
  retries: 3,
  initialDelay: 200, // ms before the first retry; doubles each retry
  maxDelay: 2_000,
  openFor: 10_000,
};

/**
 * Retry wrapped in a circuit breaker, for one primary feed URL. One failed
 * execution means every retry failed, so the breaker opens on the first.
 */
export function feedPolicy(url: string, options = FEED_POLICY): IPolicy {
  const retryPolicy = retry(handleAll, {
    maxAttempts: options.retries,
    backoff: new ExponentialBackoff({ initialDelay: options.initialDelay, maxDelay: options.maxDelay }),
  });
  const breakerPolicy = circuitBreaker(handleAll, {
    halfOpenAfter: options.openFor,
    breaker: new ConsecutiveBreaker(1),
  });

  retryPolicy.onRetry(({ delay }) => console.warn(`⚠️ Alerts feed ${url} failed; retrying in ${Math.round(delay)} ms`));
  breakerPolicy.onBreak(() => console.warn(`🚨 Alerts feed ${url} still failing; using the fallback feed for ${options.openFor / 1000} s`));
  breakerPolicy.onHalfOpen(() => console.info(`⚡ Trying alerts feed ${url} again`));
  breakerPolicy.onReset(() => console.log(`✅ Alerts feed ${url} is back`));

  return wrap(breakerPolicy, retryPolicy);
}

// One policy per primary feed URL, so one language's feed being down
// doesn't push the other languages onto their fallback feeds.
const policies = new Map<string, IPolicy>();
function policyFor(url: string): IPolicy {
  let policy = policies.get(url);
  if (!policy) {
    policy = feedPolicy(url);
    policies.set(url, policy);
  }
  return policy;
}

/**
 * Runs `primary` through `policy`, falling back to `fallbackRoute` (when
 * given) if the primary fails after its retries or the circuit is open.
 */
export function executeWithFallback<T>(policy: IPolicy, primary: () => Promise<T>, fallbackRoute?: () => Promise<T>): Promise<T> {
  return fallbackRoute
    ? wrap(fallback(handleAll, fallbackRoute), policy).execute(primary)
    : policy.execute(primary);
}

/**
 * Read a CAP RSS feed, but do nothing if it has not been modified since the given time.
 *
 * Each route downloads *and* parses its feed, so a response that isn't a
 * readable RSS feed (e.g. a parked domain's HTML page, served with a 200)
 * counts as a failure: it's retried, and then the fallback feed is read.
 * @param feed The feed to read (see alertsFeed); its fallback is used if the primary fails.
 * @param ifModifiedSince
 * @returns A list of CAPReference objects, or null if no changes have been made.
 */
export async function readCapFeedIfModified(feed: AlertsFeed, ifModifiedSince: DateTime): Promise<CAPReference[] | null> {
  const config: AxiosRequestConfig = {
    headers: {
      'User-Agent': APP_USER_AGENT,
      'If-Modified-Since': ifModifiedSince.toHTTP(),
    },
    responseType: 'text',
    // A 304 is an answer, not a failure: it mustn't be retried or trip the breaker.
    validateStatus: status => (status >= 200 && status < 300) || status === HttpStatusCode.NotModified,
  };
  const read = (url: string) => async (): Promise<CAPReference[] | null> => {
    const response = await Axios.get<string>(url, config);
    return response.status === HttpStatusCode.NotModified ? null : parseRssFeed(response.data);
  };

  return executeWithFallback(policyFor(feed.primary), read(feed.primary), feed.fallback ? read(feed.fallback) : undefined);
}

function parseRssFeed(doc: string): Promise<CAPReference[]> {
  return new Promise((resolve, reject) => {
    parseString(doc, (err: Error | null, result: any) => {
      if (err != null) {
        reject(err);
        return;
      }
      const channel = result?.rss?.channel?.[0];
      if (!channel) {
        reject(new Error('not an RSS feed'));
        return;
      }
      let ret: CAPReference[] = [];

      // A feed with no current warnings has no <item>s at all.
      for (const item of channel.item ?? []) {
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
