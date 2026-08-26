exports.up = (pgm) => {
  pgm.sql(`
    -- Devices no longer report a single location — the app now sends up to
    -- five explicitly user-chosen areas to receive warnings for (see
    -- lib/hooks/alert-areas.hook.ts), each already resolved to a lat/lon
    -- client-side and stored here as-is.
    CREATE TABLE device_areas (
      id SERIAL PRIMARY KEY,
      expo_push_token TEXT NOT NULL REFERENCES devices (expo_push_token) ON DELETE CASCADE,
      name TEXT NOT NULL,
      location geometry(Point, 4326) NOT NULL,
      UNIQUE (expo_push_token, name)
    );

    -- Backs the ST_Covers geoquery join in findMatchingDeviceTokens.
    CREATE INDEX device_areas_location_idx ON device_areas USING GIST (location);
    CREATE INDEX device_areas_expo_push_token_idx ON device_areas (expo_push_token);

    DROP INDEX IF EXISTS devices_location_idx;
    ALTER TABLE devices DROP COLUMN location;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE devices ADD COLUMN location geometry(Point, 4326);
    CREATE INDEX devices_location_idx ON devices USING GIST (location) WHERE is_active;

    DROP TABLE IF EXISTS device_areas;
  `);
};
