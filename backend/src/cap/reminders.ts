import { getActiveAlertsForRedispatch } from '../db/alerts.repo';
import { dispatchForAlert } from '../push/dispatch';

/**
 * Re-runs matching for every active, unexpired alert and re-notifies every
 * currently-matching device — regardless of whether it was already notified
 * before, for this alert or a prior reminder cycle.
 */
export async function redispatchActiveAlerts(): Promise<void> {
  const alerts = await getActiveAlertsForRedispatch();

  for (const alert of alerts) {
    try {
      await dispatchForAlert({
        id: alert.id,
        identifier: alert.identifier,
        headline: alert.headline ?? 'Weather Alert',
        description: alert.description ?? '',
        areaDesc: alert.area_desc ?? undefined,
      });
    } catch (error) {
      console.warn(`[reminders] failed to redispatch alert ${alert.identifier}:`, error);
    }
  }
}
