import { query, withTransaction } from './pool';

export interface AlertAreaInput {
  name: string;
  lat: number;
  lon: number;
}

export interface UpsertDeviceInput {
  expoPushToken: string;
  // Areas the user explicitly chose to receive weather warnings for (up to
  // MAX_ALERT_AREAS client-side — see lib/hooks/alert-areas.hook.ts). The
  // app already resolves each one to a lat/lon against its own geonames
  // copy before sending, so this is inserted as-is.
  areas: AlertAreaInput[];
  platform?: string;
  appVersion?: string;
}

/**
 * Registers a device and replaces its whole set of alert areas in one
 * transaction — a partial update (e.g. crashing mid-way through inserting a
 * new area list) must never leave a device matched against a stale area it
 * no longer wants, or briefly matched against none at all.
 */
export async function upsertDeviceAreas(input: UpsertDeviceInput): Promise<void> {
  await withTransaction(async (query) => {
    await query(
      `
      INSERT INTO devices (expo_push_token, platform, app_version, is_active, updated_at)
      VALUES ($1, $2, $3, TRUE, now())
      ON CONFLICT (expo_push_token) DO UPDATE SET
        platform = EXCLUDED.platform,
        app_version = EXCLUDED.app_version,
        is_active = TRUE,
        updated_at = now();
      `,
      [input.expoPushToken, input.platform ?? null, input.appVersion ?? null]
    );

    await query(`DELETE FROM device_areas WHERE expo_push_token = $1;`, [input.expoPushToken]);

    for (const area of input.areas) {
      await query(
        `
        INSERT INTO device_areas (expo_push_token, name, location)
        VALUES ($1, $2, ST_SetSRID(ST_MakePoint($4, $3), 4326));
        `,
        [input.expoPushToken, area.name, area.lat, area.lon]
      );
    }
  });
}

/**
 * Finds every device with at least one alert area currently inside any of
 * the alert's polygons, whether it's the initial ingestion dispatch
 * (webhook or poll) or a periodic reminder redispatch — devices are
 * notified every time this is called for as long as they're in the zone,
 * regardless of whether they were already notified before. notified_devices
 * is written for audit purposes only and no longer used to filter this
 * result.
 */
export async function findMatchingDeviceTokens(alertId: number): Promise<string[]> {
  const rows = await query<{ expo_push_token: string }>(
    `
    SELECT DISTINCT da.expo_push_token
    FROM alert_areas aa
    JOIN device_areas da ON ST_Covers(aa.geom, da.location)
    JOIN devices d ON d.expo_push_token = da.expo_push_token AND d.is_active
    WHERE aa.alert_id = $1;
    `,
    [alertId]
  );
  return rows.map((r) => r.expo_push_token);
}

export async function deactivateDeviceByToken(expoPushToken: string): Promise<void> {
  await query(`UPDATE devices SET is_active = FALSE WHERE expo_push_token = $1;`, [expoPushToken]);
}
