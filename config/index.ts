export const PRIMARY_API_URL= process.env.EXPO_PUBLIC_PRIMARY_API_URL as string;
export const FALLBACK_API_URL= process.env.EXPO_PUBLIC_FALLBACK_API_URL as string;
export const APP_USER_AGENT= process.env.EXPO_PUBLIC_APP_USER_AGENT as string;
export const APP_TIMEZONE = process.env.EXPO_PUBLIC_APP_TIMEZONE as string;
// App language on a fresh install: the "code" of one of the language files
// in lib/localization/translations. Users can change it on the Welcome
// screen or in Settings. Unset or unknown means English.
export const DEFAULT_LANGUAGE = process.env.EXPO_PUBLIC_DEFAULT_LANGUAGE;
// CAP alert feeds and senders now come from each language file
// (cap_feed_url, fallback_cap_feed_url, cap_sender_id).
if (__DEV__ && (process.env.EXPO_PUBLIC_PRIMARY_ALERTS_URL || process.env.EXPO_PUBLIC_FALLBACK_ALERTS_URL || process.env.EXPO_PUBLIC_APP_ALERTS_SENDER_ID)) {
  console.warn('EXPO_PUBLIC_PRIMARY_ALERTS_URL, EXPO_PUBLIC_FALLBACK_ALERTS_URL and EXPO_PUBLIC_APP_ALERTS_SENDER_ID are no longer used; set cap_feed_url, fallback_cap_feed_url and cap_sender_id in the language files instead.');
}
export const FORECAST_PROVIDER = process.env.EXPO_PUBLIC_FORECAST_PROVIDER ?? 'yr';
export const ALERTS_PROVIDER = process.env.EXPO_PUBLIC_ALERTS_PROVIDER ?? 'cap';
// XYZ raster tile URL template for the alert detail mini-map (AlertAreaMap).
// Defaults to the public OSM tile server, which is fine for development but
// not for production traffic (see OSM's tile usage policy) — deployments
// should point this at their own OSM tile server instead.
export const OSM_TILE_URL = process.env.EXPO_PUBLIC_OSM_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// In-app store review prompt (lib/review). The OS decides whether the prompt
// actually appears; these only control when the app asks. All optional.
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
