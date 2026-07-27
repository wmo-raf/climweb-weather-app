export const PRIMARY_API_URL= process.env.EXPO_PUBLIC_PRIMARY_API_URL as string;
export const FALLBACK_API_URL= process.env.EXPO_PUBLIC_FALLBACK_API_URL as string;
export const PRIMARY_ALERTS_URL= process.env.EXPO_PUBLIC_PRIMARY_ALERTS_URL as string;
export const FALLBACK_ALERTS_URL= process.env.EXPO_PUBLIC_FALLBACK_ALERTS_URL as string;
export const APP_USER_AGENT= process.env.EXPO_PUBLIC_APP_USER_AGENT as string;
export const APP_ALERTS_SENDER_ID= process.env.EXPO_PUBLIC_APP_ALERTS_SENDER_ID as string;
export const APP_TIMEZONE = process.env.EXPO_PUBLIC_APP_TIMEZONE as string;
export const FORECAST_PROVIDER = process.env.EXPO_PUBLIC_FORECAST_PROVIDER ?? 'yr';
export const ALERTS_PROVIDER = process.env.EXPO_PUBLIC_ALERTS_PROVIDER ?? 'cap';
// XYZ raster tile URL template for the alert detail mini-map (AlertAreaMap).
// Defaults to the public OSM tile server, which is fine for development but
// not for production traffic (see OSM's tile usage policy) — deployments
// should point this at their own OSM tile server instead.
export const OSM_TILE_URL = process.env.EXPO_PUBLIC_OSM_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
