import type { CAPAlert } from '../cap/alert';
import { query, withTransaction } from './pool';

export async function findAlertByIdentifier(identifier: string): Promise<{ id: number } | undefined> {
  const rows = await query<{ id: number }>(`SELECT id FROM alerts WHERE identifier = $1;`, [identifier]);
  return rows[0];
}

export async function deactivateAlertsByIdentifiers(identifiers: string[]): Promise<void> {
  if (identifiers.length === 0) {
    return;
  }
  await query(`UPDATE alerts SET is_active = FALSE WHERE identifier = ANY($1::text[]);`, [identifiers]);
}

/**
 * Inserts a new alert, its polygon areas, and enqueues its dispatch job
 * (see backend/src/tasks/dispatch-alert.ts) all in one transaction — an
 * alert row must never exist without a corresponding queued dispatch job,
 * and vice versa. Each polygon is normalized via ST_MakeValid + ST_Multi
 * before insert, since CAP feeds occasionally contain self-intersecting
 * polygons that PostGIS otherwise rejects on spatial queries. Polygons that
 * don't normalize to a polygonal geometry are skipped (logged), not thrown,
 * so one malformed area doesn't drop the whole alert or the transaction —
 * the dispatch job is enqueued regardless of how many (if any) polygons
 * ended up valid; dispatchForAlert's own device-matching decides relevance,
 * not this function.
 */
export async function insertAlertWithAreas(alert: CAPAlert): Promise<number> {
  const info = alert.info?.[0];

  return withTransaction(async (query) => {
    const alertRows = await query<{ id: number }>(
      `
      INSERT INTO alerts (identifier, sender, status, msg_type, scope, headline, description, expires)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id;
      `,
      [
        alert.identifier,
        alert.sender,
        alert.status,
        alert.msgType,
        alert.scope,
        info?.headline ?? null,
        info?.description ?? null,
        info?.expires ?? null,
      ]
    );
    const alertId = alertRows[0].id;

    const polygons = info?.area?.polygon ?? [];
    for (const feature of polygons) {
      try {
        await query(
          `
          INSERT INTO alert_areas (alert_id, area_desc, geom)
          SELECT $1, $2, geom FROM (
            SELECT ST_Multi(ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON($3), 4326))) AS geom
          ) normalized
          WHERE GeometryType(geom) = 'MULTIPOLYGON';
          `,
          [alertId, info?.area?.areaDesc ?? null, JSON.stringify(feature.geometry)]
        );
      } catch (error) {
        console.warn(`[alerts] failed to insert area for alert ${alert.identifier}:`, error);
      }
    }

    await query(`SELECT graphile_worker.add_job('dispatch-alert', json_build_object('alertId', $1::int));`, [alertId]);

    return alertId;
  });
}

export interface ActiveAlertForRedispatch {
  id: number;
  identifier: string;
  headline: string | null;
  description: string | null;
  area_desc: string | null;
}

/**
 * Active, unexpired alerts eligible for reminder redispatch. area_desc is
 * pulled from the first matching alert_areas row since that field lives
 * there (duplicated identically across an alert's polygon rows), not on
 * `alerts` itself.
 */
export async function getActiveAlertsForRedispatch(): Promise<ActiveAlertForRedispatch[]> {
  return query<ActiveAlertForRedispatch>(`
    SELECT a.id, a.identifier, a.headline, a.description,
           (SELECT aa.area_desc FROM alert_areas aa WHERE aa.alert_id = a.id LIMIT 1) AS area_desc
    FROM alerts a
    WHERE a.is_active = TRUE
      AND (a.expires IS NULL OR a.expires > now());
    `);
}

/**
 * Looks up a single alert for the dispatch-alert task (backend/src/tasks/dispatch-alert.ts).
 * Filtered to is_active so a job for an alert that was cancelled between
 * being enqueued and the worker picking it up just no-ops instead of
 * notifying anyone — same shape as getActiveAlertsForRedispatch above.
 */
export async function findAlertForDispatch(alertId: number): Promise<ActiveAlertForRedispatch | undefined> {
  const rows = await query<ActiveAlertForRedispatch>(
    `
    SELECT a.id, a.identifier, a.headline, a.description,
           (SELECT aa.area_desc FROM alert_areas aa WHERE aa.alert_id = a.id LIMIT 1) AS area_desc
    FROM alerts a
    WHERE a.id = $1 AND a.is_active = TRUE;
    `,
    [alertId]
  );
  return rows[0];
}
