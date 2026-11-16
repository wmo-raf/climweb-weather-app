import { SOIL_MOISTURE_BANDS, SOIL_TEMPERATURE_BANDS } from '../settings';

// Bands soil readings into plain words for the For farming page. Thresholds
// and i18n keys live in config (SOIL_MOISTURE_BANDS / SOIL_TEMPERATURE_BANDS)
// so the agromet team can tune them without touching this file.

export type SoilMoistureBand = 'dry' | 'good' | 'tooWet';
export type SoilMoistureBands = typeof SOIL_MOISTURE_BANDS;

export type SoilMoistureWords = {
  band: SoilMoistureBand;
  // i18n keys
  zone: string;
  headline: string;
  advice: string;
  // Where the value sits on the bar, 0-1.
  position: number;
  // Where the Good and Too wet zones start on the bar, 0-1.
  zoneStarts: { good: number; tooWet: number };
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// Volumetric soil water (m³/m³) -> band, wording and bar position.
export function soilMoistureWords(value: number, bands: SoilMoistureBands = SOIL_MOISTURE_BANDS): SoilMoistureWords {
  const band: SoilMoistureBand = value < bands.dryBelow ? 'dry' : value >= bands.tooWetFrom ? 'tooWet' : 'good';
  return {
    band,
    ...bands.keys[band],
    position: clamp01(value / bands.scaleMax),
    zoneStarts: {
      good: clamp01(bands.dryBelow / bands.scaleMax),
      tooWet: clamp01(bands.tooWetFrom / bands.scaleMax),
    },
  };
}

export type SoilTemperatureBand = 'cold' | 'cool' | 'warm' | 'hot';
export type SoilTemperatureBands = typeof SOIL_TEMPERATURE_BANDS;

// Soil temperature (°C) -> band and i18n keys for the words ("warm enough")
// and the advice line ("Seeds will sprout well.").
export function soilTemperatureWords(celsius: number, bands: SoilTemperatureBands = SOIL_TEMPERATURE_BANDS) {
  const band: SoilTemperatureBand =
    celsius < bands.coldBelow ? 'cold'
      : celsius < bands.coolBelow ? 'cool'
        : celsius >= bands.hotFrom ? 'hot'
          : 'warm';
  return { band, ...bands.keys[band] };
}
