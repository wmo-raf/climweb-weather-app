import { expo } from './expo-client';
import { deactivateDeviceByToken } from '../db/devices.repo';
import { getUncheckedTickets, markTicketChecked } from '../db/notifications.repo';

const RECEIPT_READY_AFTER_MINUTES = 15;

export async function checkPendingReceipts(): Promise<void> {
  const pending = await getUncheckedTickets(RECEIPT_READY_AFTER_MINUTES);
  if (pending.length === 0) {
    return;
  }

  const ticketIdToToken = new Map(pending.map((p) => [p.ticket_id, p.expo_push_token]));

  for (const idChunk of expo.chunkPushNotificationReceiptIds(pending.map((p) => p.ticket_id))) {
    let receipts;
    try {
      receipts = await expo.getPushNotificationReceiptsAsync(idChunk);
    } catch (error) {
      console.warn('[push] failed to fetch a chunk of receipts:', error);
      continue;
    }

    for (const [ticketId, receipt] of Object.entries(receipts)) {
      if (receipt.status === 'error' && receipt.details?.error === 'DeviceNotRegistered') {
        const token = ticketIdToToken.get(ticketId);
        if (token) {
          await deactivateDeviceByToken(token);
        }
      }
      await markTicketChecked(ticketId);
    }
  }
}
