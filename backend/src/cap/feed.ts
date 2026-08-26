import { DateTime } from 'luxon';
import { parseString } from 'xml2js';
import axios from 'axios';
import { config } from '../config';

export interface CapFeedItem {
  title: string;
  link: string;
  guid: string;
  pubDate: DateTime;
}

function parseRssFeed(doc: string): Promise<CapFeedItem[]> {
  return new Promise((resolve, reject) => {
    parseString(doc, (err, result) => {
      if (err != null) {
        reject(err);
        return;
      }
      const items = (result.rss.channel[0].item ?? []).map((item: any) => ({
        title: item.title[0],
        link: item.link[0],
        guid: item.guid[0],
        pubDate: DateTime.fromRFC2822(item.pubDate[0]),
      }));
      resolve(items);
    });
  });
}

/**
 * Fetches the CAP RSS feed, returning null if unchanged since the given time.
 * No circuit breaker/fallback URL here (unlike the client) — a failed fetch
 * just gets retried on the next scheduled poll cycle.
 */
export async function fetchCapFeedIfModified(ifModifiedSince?: DateTime): Promise<CapFeedItem[] | null> {
  const headers: Record<string, string> = { 'User-Agent': config.appUserAgent };
  if (ifModifiedSince) {
    headers['If-Modified-Since'] = ifModifiedSince.toHTTP() ?? '';
  }

  const response = await axios.get<string>(config.capFeedUrl, {
    headers,
    responseType: 'text',
    validateStatus: (status) => status === 200 || status === 304,
  });

  if (response.status === 304) {
    return null;
  }

  return parseRssFeed(response.data);
}

export async function fetchAlertXml(link: string): Promise<string> {
  const response = await axios.get<string>(link, {
    headers: { 'User-Agent': config.appUserAgent },
    responseType: 'text',
  });
  return response.data;
}
