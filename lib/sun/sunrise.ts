import Axios from 'axios';
import { DateTime } from 'luxon';

import { APP_USER_AGENT, SUNRISE_API_URL } from '@/config';
import { jsonStorage } from '@/lib/storage';

// Sunrise/sunset from MET Norway's Sunrise 3.0 API — never calculated on
// the device. Responses are cached per place and date in MMKV, and reused
// until their Expires time; after that the request is revalidated with
// If-Modified-Since, so a 304 keeps the cached times. The cache is also the
// offline fallback for today.
//
// API: https://api.met.no/weatherapi/sunrise/3.0/documentation
// Format: https://api.met.no/doc/formats/SunriseJSON

export type SunTimes = {
  sunrise: string | null; // ISO time in the requested offset, null when the sun doesn't rise
  sunset: string | null;
};

type SunEvent = { time?: string | null } | null | undefined;
export type SunriseResponse = {
  properties?: {
    sunrise?: SunEvent;
    sunset?: SunEvent;
  };
};

type CacheEntry = {
  times: SunTimes;
  expires?: number;      // epoch ms, from the Expires header
  lastModified?: string; // Last-Modified header, sent back as If-Modified-Since
};

const CACHE_KEY = 'sun-times';

// Reads sunrise/sunset times from a Sunrise 3.0 /sun response. Any event can
// be missing or have a null time (e.g. polar day/night).
export function parseSunriseResponse(raw: SunriseResponse): SunTimes {
  const time = (event: SunEvent) => {
    const value = event?.time;
    return typeof value === 'string' && DateTime.fromISO(value, { setZone: true }).isValid ? value : null;
  };
  return {
    sunrise: time(raw?.properties?.sunrise),
    sunset: time(raw?.properties?.sunset),
  };
}

// Daylight length in minutes, or undefined when either event is missing.
export function daylightMinutes(times: SunTimes): number | undefined {
  if (!times.sunrise || !times.sunset) return undefined;
  const minutes = DateTime.fromISO(times.sunset).diff(DateTime.fromISO(times.sunrise), 'minutes').minutes;
  return minutes > 0 ? Math.round(minutes) : undefined;
}

// "+03:00" for a zone, at the given local date.
export function utcOffset(zone: string, date: string): string {
  return DateTime.fromISO(date, { zone }).toFormat('ZZ');
}

const cacheId = (lat: number, lon: number, date: string) => `${lat.toFixed(4)},${lon.toFixed(4)}:${date}`;

function readCache(): Record<string, CacheEntry> {
  try {
    return JSON.parse(jsonStorage.getItem(CACHE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

// Keeps only entries for `date` and later, so old days don't pile up.
function writeCache(id: string, entry: CacheEntry, date: string): void {
  const cache = readCache();
  cache[id] = entry;
  for (const key of Object.keys(cache)) {
    if (key.slice(key.indexOf(':') + 1) < date) delete cache[key];
  }
  jsonStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export function getCachedSunTimes(lat: number, lon: number, date: string): SunTimes | undefined {
  return readCache()[cacheId(lat, lon, date)]?.times;
}

const header = (headers: Record<string, unknown>, name: string): string | undefined => {
  const value = headers[name] ?? headers[name.toLowerCase()];
  return typeof value === 'string' ? value : undefined;
};

const parseExpires = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : undefined;
};

// Sun times for a place on a local date (YYYY-MM-DD), in the given UTC
// offset ("+03:00"). Throws only when there's neither a network response nor
// a cached one.
export async function getSunTimes(lat: number, lon: number, date: string, offset: string): Promise<SunTimes> {
  const id = cacheId(lat, lon, date);
  const cached = readCache()[id];

  if (cached && cached.expires !== undefined && cached.expires > Date.now()) {
    return cached.times;
  }

  try {
    const response = await Axios.get<SunriseResponse>(`${SUNRISE_API_URL}/sun`, {
      // MET returns 403 without an identifying User-Agent.
      headers: {
        'User-Agent': APP_USER_AGENT,
        ...(cached?.lastModified ? { 'If-Modified-Since': cached.lastModified } : {}),
      },
      params: { lat: lat.toFixed(4), lon: lon.toFixed(4), date, offset },
      timeout: 5_000,
      validateStatus: status => status === 200 || status === 304,
    });

    const headers = response.headers as Record<string, unknown>;
    const expires = parseExpires(header(headers, 'Expires'));
    const lastModified = header(headers, 'Last-Modified') ?? cached?.lastModified;

    if (response.status === 304 && cached) {
      writeCache(id, { ...cached, expires, lastModified }, date);
      return cached.times;
    }

    const times = parseSunriseResponse(response.data);
    writeCache(id, { times, expires, lastModified }, date);
    return times;
  } catch (error) {
    // Offline or the service is down: today's cached times are still right.
    if (cached) return cached.times;
    throw error;
  }
}
