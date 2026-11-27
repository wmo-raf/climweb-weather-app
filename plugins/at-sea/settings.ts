import configFile from './config.json';

// At sea plugin settings. The areas and thresholds come from config.json in
// this folder, which a deployment (an app flavour built from the templates)
// replaces with its own; the Read more links from the .env. The bundled
// config.json and link defaults are TMA's (Tanzania).

// "Read more" links.
export const MARINE_FORECAST_URL = process.env.EXPO_PUBLIC_MARINE_FORECAST_URL ?? 'https://www.meteo.go.tz/services/marine-weather-forecast';
export const TSUNAMI_CENTRE_URL = process.env.EXPO_PUBLIC_TSUNAMI_CENTRE_URL ?? 'https://www.meteo.go.tz/services/tsunami-centre';

export type WaterType = 'ocean' | 'lake';

// When the wind and rain words, and their advice, change: config.json's
// "thresholds". Wind in knots, rain in mm over the next 24 hours. Below
// `moderate` wind is light; below `light` there is no rain.
export type MarineThresholds = {
  wind_kt: Record<WaterType, { moderate: number; strong: number }>;
  rain_24h_mm: { light: number; moderate: number; heavy: number };
};

// Typed against the file: a config.json missing a value fails the type-check.
export const MARINE_THRESHOLDS: MarineThresholds = configFile.thresholds;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Marine areas the user picks from at the top of the page: config.json's
// "areas". Each area, in list order:
// - `id`: stable; the user's choice is saved under it
// - `type`: "ocean" or "lake", which picks the wind thresholds
// - `lat`/`lon`: the forecast point, on the water where boats go
// - `name`: the name per language code ("en", "sw", ...); English, then the
//   id, stands in for a language that has none
// TMA's config lists its coasts and lakes north to south, with points a few
// kilometres offshore: placeholders until TMA confirms its own.
export type MarineArea = { id: string; type: WaterType; lat: number; lon: number; name: Record<string, string> };

const isName = (value: unknown): value is Record<string, string> =>
  isRecord(value) && Object.values(value).every(v => typeof v === 'string');

const isArea = (value: unknown): value is MarineArea =>
  isRecord(value) && typeof value.id === 'string' && !!value.id
  && (value.type === 'ocean' || value.type === 'lake')
  && typeof value.lat === 'number' && Math.abs(value.lat) <= 90
  && typeof value.lon === 'number' && Math.abs(value.lon) <= 180
  && isName(value.name);

// The valid areas in a config.json document ({ "areas": [...] }), in
// order. Invalid entries are dropped (with a warning in development), so
// one bad line doesn't take the page down.
export function parseMarineAreas(raw: unknown): MarineArea[] {
  const list = isRecord(raw) && Array.isArray(raw.areas) ? raw.areas : [];
  const areas = list.filter(isArea);
  if (__DEV__ && areas.length !== list.length) {
    console.warn(`plugins/at-sea/config.json: ${list.length - areas.length} invalid area(s) left out.`);
  }
  return areas;
}

export const MARINE_AREAS = parseMarineAreas(configFile);
