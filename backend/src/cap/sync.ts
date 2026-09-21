import { DateTime } from 'luxon';
import { parseFromXML } from './alert';
import { fetchAlertXml, fetchCapFeedIfModified } from './feed';
import { processAlert } from './process';

let lastModified: DateTime | undefined;

export async function pollOnce(): Promise<void> {
  const items = await fetchCapFeedIfModified(lastModified);
  if (!items) {
    return;
  }

  for (const item of items) {
    if (lastModified && item.pubDate <= lastModified) {
      continue;
    }

    let alert;
    try {
      const xml = await fetchAlertXml(item.link);
      alert = await parseFromXML(xml);
    } catch (error) {
      console.warn(`[cap] failed to fetch/parse alert at ${item.link}:`, error);
      continue;
    }

    try {
      await processAlert(alert);
    } catch (error) {
      console.warn(`[cap] failed to process alert ${alert.identifier}:`, error);
    }
  }

  lastModified = DateTime.now();
}
