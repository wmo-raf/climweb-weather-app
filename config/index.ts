export const PRIMARY_API_URL= process.env.EXPO_PUBLIC_PRIMARY_API_URL as string;
export const FALLBACK_API_URL= process.env.EXPO_PUBLIC_FALLBACK_API_URL as string;
export const PRIMARY_ALERTS_URL= process.env.EXPO_PUBLIC_PRIMARY_ALERTS_URL as string;
export const FALLBACK_ALERTS_URL= process.env.EXPO_PUBLIC_FALLBACK_ALERTS_URL as string;
export const APP_USER_AGENT= process.env.EXPO_PUBLIC_APP_USER_AGENT as string;
export const APP_ALERTS_SENDER_ID= process.env.EXPO_PUBLIC_APP_ALERTS_SENDER_ID as string;
export const APP_TIMEZONE = process.env.EXPO_PUBLIC_APP_TIMEZONE as string;
export const FORECAST_PROVIDER = process.env.EXPO_PUBLIC_FORECAST_PROVIDER ?? 'yr';
export const ALERTS_PROVIDER = process.env.EXPO_PUBLIC_ALERTS_PROVIDER ?? 'cap';
// MET Norway Sunrise 3.0 (lib/sun). The service ("Celestial") can also be
// self-hosted, so a deployment may point this at its own instance.
export const SUNRISE_API_URL = process.env.EXPO_PUBLIC_SUNRISE_API_URL ?? 'https://api.met.no/weatherapi/sunrise/3.0';
// Soil temperature and moisture for the For farming page (lib/soil). Comes
// from Open-Meteo until the main forecast feed carries soil data; a new
// source is a new SoilDataSource implementation plus this one value.
export const SOIL_PROVIDER = process.env.EXPO_PUBLIC_SOIL_PROVIDER ?? 'open-meteo';
export const OPEN_METEO_API_URL = process.env.EXPO_PUBLIC_OPEN_METEO_API_URL ?? 'https://api.open-meteo.com/v1/forecast';
// Only needed on Open-Meteo's commercial plan, together with its customer-
// API URL above. Leave unset on the free (non-commercial) API.
export const OPEN_METEO_API_KEY = process.env.EXPO_PUBLIC_OPEN_METEO_API_KEY || undefined;
// Hourly variables to request. 6 cm and 3-9 cm sit around sowing depth;
// the 0 cm "soil" temperature is the bare surface, which runs far hotter.
export const OPEN_METEO_SOIL_TEMPERATURE_VAR = process.env.EXPO_PUBLIC_OPEN_METEO_SOIL_TEMPERATURE_VAR ?? 'soil_temperature_6cm';
export const OPEN_METEO_SOIL_MOISTURE_VAR = process.env.EXPO_PUBLIC_OPEN_METEO_SOIL_MOISTURE_VAR ?? 'soil_moisture_3_to_9cm';
// XYZ raster tile URL template for the alert detail mini-map (AlertAreaMap).
// Defaults to the public OSM tile server, which is fine for development but
// not for production traffic (see OSM's tile usage policy) — deployments
// should point this at their own OSM tile server instead.
export const OSM_TILE_URL = process.env.EXPO_PUBLIC_OSM_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// In-app store review prompt (lib/review). The OS decides whether the prompt
// actually appears; these only control when the app asks. All optional.
const finiteNumber = (value: string | undefined, fallback: number): number => {
  const n = parseFloat(value ?? '');
  return Number.isFinite(n) ? n : fallback;
};
const nonNegativeInt = (value: string | undefined, fallback: number): number => {
  const n = parseInt(value ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};
// Distinct days the app must have been opened on before asking.
export const REVIEW_MIN_DAYS_USED = nonNegativeInt(process.env.EXPO_PUBLIC_REVIEW_MIN_DAYS_USED, 5);
// Days since first launch before asking.
export const REVIEW_MIN_DAYS_SINCE_INSTALL = nonNegativeInt(process.env.EXPO_PUBLIC_REVIEW_MIN_DAYS_SINCE_INSTALL, 7);
// Minimum gap between two asks.
export const REVIEW_MIN_DAYS_BETWEEN_PROMPTS = nonNegativeInt(process.env.EXPO_PUBLIC_REVIEW_MIN_DAYS_BETWEEN_PROMPTS, 90);
// Lifetime cap on asks (the OS has its own cap on top of this).
export const REVIEW_MAX_PROMPTS = nonNegativeInt(process.env.EXPO_PUBLIC_REVIEW_MAX_PROMPTS, 3);
// Development builds only: log why each check didn't ask, and show an alert
// instead of the real prompt when it would ask. Ignored in release builds.
export const REVIEW_DEBUG = process.env.EXPO_PUBLIC_REVIEW_DEBUG === 'true';

// Default display units for a fresh install, per deployment. Users can
// change them in Settings > Units. Values: temperature celsius|fahrenheit;
// wind kmh|ms|knots|mph; precipitation mm|in. Invalid values fall back to
// celsius / kmh / mm (see lib/store/units-store.ts).
export const DEFAULT_TEMPERATURE_UNIT = process.env.EXPO_PUBLIC_DEFAULT_TEMPERATURE_UNIT ?? 'celsius';
export const DEFAULT_WIND_UNIT = process.env.EXPO_PUBLIC_DEFAULT_WIND_UNIT ?? 'kmh';
export const DEFAULT_PRECIPITATION_UNIT = process.env.EXPO_PUBLIC_DEFAULT_PRECIPITATION_UNIT ?? 'mm';

// At sea page (app/(tabs)/More/AtSea.tsx).
const csv = (value: string | undefined, fallback: string[]): string[] => {
  const items = (value ?? '').split(',').map(s => s.trim()).filter(Boolean);
  return items.length ? items : fallback;
};
// A CAP alert counts as an at-sea advisory when its event, headline or an
// eventCode value contains one of these words (whole word, case-insensitive,
// plural "s" allowed — see lib/alerts/at-sea.ts). Covers English and Swahili
// wording; override with a comma-separated EXPO_PUBLIC_AT_SEA_WARNING_KEYWORDS.
export const AT_SEA_WARNING_KEYWORDS = csv(process.env.EXPO_PUBLIC_AT_SEA_WARNING_KEYWORDS, [
  'wind', 'gale', 'marine', 'sea', 'wave', 'swell', 'cyclone', 'tropical storm', 'storm surge', 'tsunami', 'coastal',
  'upepo', 'bahari', 'mawimbi', 'kimbunga',
]);
// Short name of the national weather service, for "Read more from …".
export const NAME_OF_THE_NHMS = process.env.EXPO_PUBLIC_NAME_OF_THE_NHMS || 'TMA';
// At sea "Read more" links.
export const MARINE_FORECAST_URL = process.env.EXPO_PUBLIC_MARINE_FORECAST_URL ?? 'https://www.meteo.go.tz/services/marine-weather-forecast';
export const TSUNAMI_CENTRE_URL = process.env.EXPO_PUBLIC_TSUNAMI_CENTRE_URL ?? 'https://www.meteo.go.tz/services/tsunami-centre';

// For farming page (app/(tabs)/More/Farming.tsx). The thresholds below are
// placeholders until TMA's agromet team sets them.
//
// Water in the soil, in m³/m³ (volumetric water content): below `dryBelow`
// is dry, from `tooWetFrom` up is too wet, in between is good. `scaleMax` is
// the right-hand end of the bar. Each band's text is an i18n key.
export const SOIL_MOISTURE_BANDS = {
  dryBelow: finiteNumber(process.env.EXPO_PUBLIC_SOIL_MOISTURE_DRY_BELOW, 0.15),
  tooWetFrom: finiteNumber(process.env.EXPO_PUBLIC_SOIL_MOISTURE_TOO_WET_FROM, 0.35),
  scaleMax: 0.5,
  keys: {
    dry: { zone: 'farming.moisture.zones.dry', headline: 'farming.moisture.dry.headline', advice: 'farming.moisture.dry.advice' },
    good: { zone: 'farming.moisture.zones.good', headline: 'farming.moisture.good.headline', advice: 'farming.moisture.good.advice' },
    tooWet: { zone: 'farming.moisture.zones.tooWet', headline: 'farming.moisture.tooWet.headline', advice: 'farming.moisture.tooWet.advice' },
  },
};
// Soil temperature, in °C: below `coldBelow` is too cold, below `coolBelow`
// is cool, from `hotFrom` up is too hot, in between is warm enough.
export const SOIL_TEMPERATURE_BANDS = {
  coldBelow: finiteNumber(process.env.EXPO_PUBLIC_SOIL_TEMPERATURE_COLD_BELOW, 12),
  coolBelow: finiteNumber(process.env.EXPO_PUBLIC_SOIL_TEMPERATURE_COOL_BELOW, 20),
  hotFrom: finiteNumber(process.env.EXPO_PUBLIC_SOIL_TEMPERATURE_HOT_FROM, 40),
  keys: {
    cold: { words: 'farming.temperature.cold.words', advice: 'farming.temperature.cold.advice' },
    cool: { words: 'farming.temperature.cool.words', advice: 'farming.temperature.cool.advice' },
    warm: { words: 'farming.temperature.warm.words', advice: 'farming.temperature.warm.advice' },
    hot: { words: 'farming.temperature.hot.words', advice: 'farming.temperature.hot.advice' },
  },
};
// "Read more" links.
export const SEASONAL_FORECAST_URL = process.env.EXPO_PUBLIC_SEASONAL_FORECAST_URL ?? 'https://www.meteo.go.tz/publications/seasonal-weather-forecast';
export const AGROMET_BULLETINS_URL = process.env.EXPO_PUBLIC_AGROMET_BULLETINS_URL ?? 'https://www.meteo.go.tz/publications/agrometeorological-bulletins';
