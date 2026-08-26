import type { ExpoPushMessage } from 'expo-server-sdk';
import { expo } from './expo-client';
import { deactivateDeviceByToken, findMatchingDeviceTokens } from '../db/devices.repo';
import { insertPushTickets } from '../db/notifications.repo';
import { logger } from '../logger';

export interface AlertForDispatch {
  id: number;
  identifier: string;
  headline: string;
  description: string;
  areaDesc?: string;
}

export async function dispatchForAlert(alert: AlertForDispatch): Promise<void> {
  const tokens = await findMatchingDeviceTokens(alert.id);
  if (tokens.length === 0) {
    return;
  }

  const messages: ExpoPushMessage[] = tokens.map((to) => ({
    to,
    title: alert.headline,
    body: alert.description,
    data: { alertID: alert.identifier, areaDesc: alert.areaDesc },
    sound: 'default',
    priority: 'high',
  }));

  for (const chunk of expo.chunkPushNotifications(messages)) {
    let tickets;
    try {
      tickets = await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.warn('[push] failed to send a chunk of notifications:', error);
      continue;
    }

    const okTickets: { ticketId: string; expoPushToken: string }[] = [];
    tickets.forEach((ticket, i) => {
      const token = chunk[i].to as string;
      if (ticket.status === 'ok') {
        okTickets.push({ ticketId: ticket.id, expoPushToken: token });
        logger.info(
          {
            event: { action: 'device_notified', category: ['notification'] },
            alert: { id: alert.id, identifier: alert.identifier },
            expo: { push_token: token },
          },
          'Device notified for alert'
        );
      } else if (ticket.details?.error === 'DeviceNotRegistered') {
        deactivateDeviceByToken(token).catch((error) =>
          console.warn(`[push] failed to deactivate device ${token}:`, error)
        );
      }
    });

    await insertPushTickets(okTickets);
  }
}
