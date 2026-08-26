import type { CAPAlert } from './alert';
import { isRelevant } from './relevance';
import { deactivateAlertsByIdentifiers, findAlertByIdentifier, insertAlertWithAreas } from '../db/alerts.repo';

/**
 * Shared ingestion logic for a single CAP alert, used by both the feed
 * poller (src/cap/sync.ts) and the webhook route — ingestion behavior is
 * identical regardless of which path delivered the alert. Dispatching push
 * notifications is NOT done here — insertAlertWithAreas enqueues a
 * dispatch-alert job (backend/src/tasks/dispatch-alert.ts) in the same
 * transaction as the insert, so ingestion stays fast regardless of how many
 * devices end up matching.
 */
export async function processAlert(alert: CAPAlert): Promise<void> {
  if (!isRelevant(alert)) {
    return;
  }

  if (alert.msgType === 'Cancel' || alert.msgType === 'Update') {
    const refIds = (alert.references ?? []).map((r) => r.identifier);
    if (refIds.length) {
      await deactivateAlertsByIdentifiers(refIds);
    }
    if (alert.msgType === 'Cancel') {
      return;
    }
  }

  if (await findAlertByIdentifier(alert.identifier)) {
    return; // already processed, idempotent re-poll/re-post safety
  }

  await insertAlertWithAreas(alert);
}
