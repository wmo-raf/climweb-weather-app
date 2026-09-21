import { query } from './pool';

export interface PushTicketInput {
  ticketId: string;
  expoPushToken: string;
}

export async function insertPushTickets(tickets: PushTicketInput[]): Promise<void> {
  if (tickets.length === 0) {
    return;
  }
  const ticketIds = tickets.map((t) => t.ticketId);
  const tokens = tickets.map((t) => t.expoPushToken);
  await query(
    `
    INSERT INTO push_tickets (ticket_id, expo_push_token)
    SELECT * FROM unnest($1::text[], $2::text[])
    ON CONFLICT (ticket_id) DO NOTHING;
    `,
    [ticketIds, tokens]
  );
}

export async function getUncheckedTickets(olderThanMinutes: number): Promise<{ ticket_id: string; expo_push_token: string }[]> {
  return query<{ ticket_id: string; expo_push_token: string }>(
    `
    SELECT ticket_id, expo_push_token
    FROM push_tickets
    WHERE checked_at IS NULL
      AND created_at <= now() - ($1 || ' minutes')::interval;
    `,
    [olderThanMinutes]
  );
}

export async function markTicketChecked(ticketId: string): Promise<void> {
  await query(`UPDATE push_tickets SET checked_at = now() WHERE ticket_id = $1;`, [ticketId]);
}
