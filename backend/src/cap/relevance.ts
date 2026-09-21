import { DateTime } from 'luxon';
import type { CAPAlert } from './alert';
import { config } from '../config';

/**
 * Mirrors the client's CAPCollector.isRelevant() filter
 * (lib/alerts/providers/cap-alerts/collector.ts in the Expo app).
 */
export function isRelevant(alert: CAPAlert): boolean {
  const info = alert.info?.[0];
  if (!info) {
    return false;
  }

  if (alert.sender !== config.capAlertsSenderId) return false;
  if (alert.status !== 'Actual') return false;
  if (alert.scope !== 'Public') return false;
  //if (info.expires && DateTime.fromISO(info.expires) <= DateTime.now()) return false;

  return true;
}
