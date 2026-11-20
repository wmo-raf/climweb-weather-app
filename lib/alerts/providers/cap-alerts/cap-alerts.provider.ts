import { CAPAlert } from './alert';
import { CAPCollector } from './collector';
import { alertsFeed } from './rss';
import { AlertsProviderInterface } from '../../interfaces';

export class CAPAlertsProvider implements AlertsProviderInterface {
  // One collector per feed, kept for the app's lifetime so each feed's
  // incremental If-Modified-Since polling persists. Languages configured
  // with the same feed URLs and sender share a collector, so a shared feed
  // is only fetched once.
  private readonly collectors = new Map<string, CAPCollector>();

  async getAlerts(language: string): Promise<CAPAlert[]> {
    const feed = alertsFeed(language);
    // No feed configured for this language or the default: no alerts.
    if (!feed) return [];
    const key = [feed.primary, feed.fallback, feed.senderId].join('\n');
    let collector = this.collectors.get(key);
    if (!collector) {
      collector = new CAPCollector(feed);
      this.collectors.set(key, collector);
    }
    await collector.update();
    return collector.activeMessages();
  }
}
