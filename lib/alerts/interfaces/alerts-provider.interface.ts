import { CAPAlert } from '@/lib/alerts/providers/cap-alerts/alert';

export interface AlertsProviderInterface {
  // `language` is the app language; providers use it to pick that
  // language's feed (see alertsFeed). Screens then show each alert's
  // matching <info> block via selectInfo().
  getAlerts(language: string): Promise<CAPAlert[]>;
}
