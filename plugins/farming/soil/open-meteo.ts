import Axios from 'axios';
import { DateTime, FixedOffsetZone } from 'luxon';

import { APP_TIMEZONE, APP_USER_AGENT } from '@/config';
import {
  OPEN_METEO_API_KEY,
  OPEN_METEO_API_URL,
  OPEN_METEO_SOIL_MOISTURE_VAR,
  OPEN_METEO_SOIL_TEMPERATURE_VAR,
} from '../settings';
import { SoilData, SoilDataSource, SoilHour } from './soil-data-source';

// Open-Meteo Forecast API (https://open-meteo.com/en/docs). Soil
// temperature comes in °C and soil moisture in m³/m³; both are used as-is.

export type OpenMeteoResponse = {
  utc_offset_seconds?: number;
  hourly_units?: Record<string, string>;
  hourly?: { time?: string[] } & Record<string, (number | null)[] | string[] | undefined>;
};

const numberOrNull = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

// Hourly times come back local to the requested timezone, without an
// offset ("2026-11-02T09:00"); utc_offset_seconds pins them down.
export function parseOpenMeteoSoil(
  raw: OpenMeteoResponse,
  temperatureVar: string = OPEN_METEO_SOIL_TEMPERATURE_VAR,
  moistureVar: string = OPEN_METEO_SOIL_MOISTURE_VAR,
): SoilData {
  const times = raw?.hourly?.time ?? [];
  const temperatures = (raw?.hourly?.[temperatureVar] ?? []) as unknown[];
  const moistures = (raw?.hourly?.[moistureVar] ?? []) as unknown[];
  const zone = FixedOffsetZone.instance((raw?.utc_offset_seconds ?? 0) / 60);

  const hours: SoilHour[] = [];
  times.forEach((time, i) => {
    const dt = DateTime.fromISO(time, { zone });
    if (!dt.isValid) return;
    hours.push({ time: dt.toISO()!, temperature: numberOrNull(temperatures[i]), moisture: numberOrNull(moistures[i]) });
  });
  return { hours };
}

// Expiry from Cache-Control max-age or Expires, if the response sends either.
export function expiryFromHeaders(headers: Record<string, unknown>, now: number = Date.now()): number | undefined {
  const cacheControl = headers['cache-control'];
  const maxAge = typeof cacheControl === 'string' ? /max-age=(\d+)/.exec(cacheControl)?.[1] : undefined;
  if (maxAge) return now + parseInt(maxAge, 10) * 1000;
  const expires = headers['expires'];
  const ms = typeof expires === 'string' ? Date.parse(expires) : NaN;
  return Number.isFinite(ms) ? ms : undefined;
}

export class OpenMeteoSoilDataSource implements SoilDataSource {
  async getSoilData(lat: number, lon: number): Promise<SoilData> {
    const { data, headers } = await Axios.get<OpenMeteoResponse>(OPEN_METEO_API_URL, {
      headers: { 'User-Agent': APP_USER_AGENT },
      params: {
        latitude: lat.toFixed(4),
        longitude: lon.toFixed(4),
        hourly: `${OPEN_METEO_SOIL_TEMPERATURE_VAR},${OPEN_METEO_SOIL_MOISTURE_VAR}`,
        timezone: APP_TIMEZONE,
        forecast_days: 2,
        ...(OPEN_METEO_API_KEY ? { apikey: OPEN_METEO_API_KEY } : {}),
      },
      timeout: 5_000,
    });
    return { ...parseOpenMeteoSoil(data), expiresAt: expiryFromHeaders(headers as Record<string, unknown>) };
  }
}
