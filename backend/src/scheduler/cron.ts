import cron from 'node-cron';
import { config } from '../config';
import { pollOnce } from '../cap/sync';
import { checkPendingReceipts } from '../push/receipts';
import { redispatchActiveAlerts } from '../cap/reminders';

// `*/N * * * *` steps on the minute field (0-59) and is only evenly spaced
// for values of N that divide 60 — keep POLL_INTERVAL_MINUTES/
// RECEIPT_CHECK_INTERVAL_MINUTES to one of those. REMINDER_INTERVAL_MINUTES
// is expected to be much coarser (hours), so it steps on the hour field
// instead — see the `0 */H * * *` expression below.
export function startScheduler(): void {
  if (config.reminderIntervalMinutes <= 0 || config.reminderIntervalMinutes % 60 !== 0) {
    throw new Error('REMINDER_INTERVAL_MINUTES must be a positive multiple of 60 (scheduled on the hour field)');
  }

  cron.schedule(`*/${config.pollIntervalMinutes} * * * *`, () => {
    pollOnce().catch((error) => console.error('[cron] CAP poll failed:', error));
  });

  cron.schedule(`*/${config.receiptCheckIntervalMinutes} * * * *`, () => {
    checkPendingReceipts().catch((error) => console.error('[cron] receipt check failed:', error));
  });

  const reminderIntervalHours = config.reminderIntervalMinutes / 60;
  cron.schedule(`0 */${reminderIntervalHours} * * *`, () => {
    redispatchActiveAlerts().catch((error) => console.error('[cron] reminder redispatch failed:', error));
  });
}
