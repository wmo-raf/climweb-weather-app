import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../logger';

export const pool = new Pool({ connectionString: config.databaseUrl });

// An idle client (or, once checked out, an active one — see the 'connect'
// handler below) can emit its own 'error' event (e.g. the connection was
// terminated server-side) — without a handler, that's an unhandled event
// that crashes the process. Log it instead; the pool reconnects on the next
// query. graphile-worker (backend/src/index.ts, shares this pool) checks
// for both handlers on boot and warns if either is missing.
pool.on('error', (error) => {
  logger.error({ error }, '[db] idle client error');
});
pool.on('connect', (client) => {
  client.on('error', (error) => {
    logger.error({ error }, '[db] active client error');
  });
});

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows;
}

export type TransactionQuery = <T = any>(text: string, params?: any[]) => Promise<T[]>;

// Used by upsertDeviceAreas, which replaces a device's whole set of areas
// (delete + re-insert) and needs that to be atomic — a mid-update read must
// never see a device with zero areas.
export async function withTransaction<T>(fn: (query: TransactionQuery) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const scopedQuery: TransactionQuery = async (text, params = []) => {
      const result = await client.query(text, params);
      return result.rows;
    };
    const result = await fn(scopedQuery);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
