import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { CAPAlert, alertLevel, baseLanguage, selectInfo } from '@/lib/alerts/providers/cap-alerts/alert';
import { createAlertsProvider } from '@/lib/alerts/providers';
import { alertsFeed } from '@/lib/alerts/providers/cap-alerts/rss';

// Singleton so the underlying CAPCollector's incremental If-Modified-Since
// polling (see collector.ts) actually persists across refetches instead of
// starting over on every call.
const alertsProvider = createAlertsProvider();

const levelYellowAndAbove = (alert: CAPAlert, language: string): boolean => {
  const info = selectInfo(alert, language);
  if (!info) {
    return false;
  }
  switch (alertLevel(info)) {
    case 'Red':
    case 'Orange':
    case 'Yellow':
      return true;
    default:
      return false;
  }
};

// Keyed by language and by that language's feed settings (see alertsFeed):
// switching language fetches that feed, switching back is served from
// cache, and changing a feed URL or sender in a language file starts a new
// cache instead of showing results saved under the old settings (e.g. "no
// alerts" saved while a sender was wrong).
export const alertsQueryKey = (language: string) => {
  const feed = alertsFeed(language);
  return ['alerts', baseLanguage(language), feed?.primary ?? '', feed?.fallback ?? '', feed?.senderId ?? ''] as const;
};

// Alerts go stale twice as fast as the forecast (see forecastQueryKey's
// useForecastQuery) — a CAP feed can publish a new warning at any time, so
// it's worth checking more often than "how's the weather looking" data.
const ALERTS_STALE_TIME = 30 * 60 * 1000;

export function useAlertsQuery(): UseQueryResult<CAPAlert[], Error> {
  const { i18n } = useTranslation();
  const language = baseLanguage(i18n.language);

  return useQuery({
    queryKey: alertsQueryKey(language),
    queryFn: async () => {
      try {
        const alerts = await alertsProvider.getAlerts(language);
        return alerts.filter(alert => levelYellowAndAbove(alert, language));
      } catch (error) {
        console.error('Loading alerts rejected:', error);
        throw new Error('There was a problem getting the location alerts. Please try again later.');
      }
    },
    staleTime: ALERTS_STALE_TIME,
  });
}
