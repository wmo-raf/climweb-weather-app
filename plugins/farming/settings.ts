import { finiteNumber } from '@/config/parse';

// For farming plugin settings. The defaults are TMA's (Tanzania), and the
// soil thresholds are placeholders until TMA's agromet team sets them;
// another deployment enabling this plugin should override them in its .env.

// Soil temperature and moisture (soil/). Comes from Open-Meteo until the
// main forecast feed carries soil data; a new source is a new
// SoilDataSource implementation plus this one value.
export const SOIL_PROVIDER = process.env.EXPO_PUBLIC_SOIL_PROVIDER ?? 'open-meteo';
export const OPEN_METEO_API_URL = process.env.EXPO_PUBLIC_OPEN_METEO_API_URL ?? 'https://api.open-meteo.com/v1/forecast';
// Only needed on Open-Meteo's commercial plan, together with its customer-
// API URL above. Leave unset on the free (non-commercial) API.
export const OPEN_METEO_API_KEY = process.env.EXPO_PUBLIC_OPEN_METEO_API_KEY || undefined;
// Hourly variables to request. 6 cm and 3-9 cm sit around sowing depth;
// the 0 cm "soil" temperature is the bare surface, which runs far hotter.
export const OPEN_METEO_SOIL_TEMPERATURE_VAR = process.env.EXPO_PUBLIC_OPEN_METEO_SOIL_TEMPERATURE_VAR ?? 'soil_temperature_6cm';
export const OPEN_METEO_SOIL_MOISTURE_VAR = process.env.EXPO_PUBLIC_OPEN_METEO_SOIL_MOISTURE_VAR ?? 'soil_moisture_3_to_9cm';

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
