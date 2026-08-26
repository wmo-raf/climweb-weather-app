import type { Task } from 'graphile-worker';
import { findAlertForDispatch } from '../db/alerts.repo';
import { dispatchForAlert } from '../push/dispatch';
import { logger } from '../logger';

export const DISPATCH_ALERT_TASK = 'dispatch-alert';

interface DispatchAlertPayload {
  alertId: number;
}

function isDispatchAlertPayload(payload: unknown): payload is DispatchAlertPayload {
  return typeof payload === 'object' && payload !== null && typeof (payload as { alertId?: unknown }).alertId === 'number';
}

/**
 * Enqueued atomically alongside the alert insert (see
 * insertAlertWithAreas in db/alerts.repo.ts) instead of dispatching
 * synchronously inside the ingestion path (webhook request / feed-poll
 * cron tick) — decouples "acknowledge the alert" from "find matching
 * devices and send push notifications", which can take a while as device
 * counts grow. graphile-worker retries this task with backoff on failure;
 * see backend/src/index.ts for where it's registered.
 */
export const dispatchAlertTask: Task = async (payload) => {
  if (!isDispatchAlertPayload(payload)) {
    throw new Error(`[dispatch-alert] invalid payload: ${JSON.stringify(payload)}`);
  }

  const alert = await findAlertForDispatch(payload.alertId);
  if (!alert) {
    // Deactivated (e.g. a near-simultaneous Cancel message) between being
    // enqueued and this job running — nothing to notify.
    logger.info({ alertId: payload.alertId }, '[dispatch-alert] alert no longer active, skipping');
    return;
  }

  await dispatchForAlert({
    id: alert.id,
    identifier: alert.identifier,
    headline: alert.headline ?? 'Weather Alert',
    description: alert.description ?? '',
    areaDesc: alert.area_desc ?? undefined,
  });
};
