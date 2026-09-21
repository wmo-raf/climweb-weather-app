exports.up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS postgis;

    CREATE TABLE alerts (
      id SERIAL PRIMARY KEY,
      identifier TEXT NOT NULL UNIQUE,
      sender TEXT NOT NULL,
      status TEXT NOT NULL,
      msg_type TEXT NOT NULL,
      scope TEXT NOT NULL,
      headline TEXT,
      description TEXT,
      expires TIMESTAMPTZ,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Used by getActiveAlertsForRedispatch's reminder-cycle query.
    CREATE INDEX alerts_active_expires_idx ON alerts (is_active, expires);

    CREATE TABLE alert_areas (
      id SERIAL PRIMARY KEY,
      alert_id INTEGER NOT NULL REFERENCES alerts (id) ON DELETE CASCADE,
      area_desc TEXT,
      geom geometry(MultiPolygon, 4326) NOT NULL
    );

    -- Backs the ST_Covers geoquery join in findMatchingDeviceTokens.
    CREATE INDEX alert_areas_geom_idx ON alert_areas USING GIST (geom);
    CREATE INDEX alert_areas_alert_id_idx ON alert_areas (alert_id);

    CREATE TABLE devices (
      expo_push_token TEXT PRIMARY KEY,
      location geometry(Point, 4326) NOT NULL,
      platform TEXT,
      app_version TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Partial: only active devices are ever matched against alert polygons.
    CREATE INDEX devices_location_idx ON devices USING GIST (location) WHERE is_active;

    CREATE TABLE push_tickets (
      ticket_id TEXT PRIMARY KEY,
      expo_push_token TEXT NOT NULL REFERENCES devices (expo_push_token),
      checked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Backs getUncheckedTickets' receipt-sweep query.
    CREATE INDEX push_tickets_unchecked_idx ON push_tickets (created_at) WHERE checked_at IS NULL;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS push_tickets;
    DROP TABLE IF EXISTS devices;
    DROP TABLE IF EXISTS alert_areas;
    DROP TABLE IF EXISTS alerts;
  `);
};
