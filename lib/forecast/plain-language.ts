// Buckets raw wind/rain measurements into plain-language levels so the UI
// never shows a bare km/h or mm figure — every number gets a word next to it.
// Thresholds are simple, UI-facing categories (not a meteorological product),
// tuned for a lake-fishing safety context per DCCMS guidance in the design reference.

export type WindLevel = 'calm' | 'gentle' | 'breezy' | 'strong' | 'severe';
export type RainLevel = 'none' | 'light' | 'moderate' | 'heavy';

export function windLevel(windSpeedKmh: number | undefined): WindLevel {
  const speed = windSpeedKmh ?? 0;
  if (speed < 5) return 'calm';
  if (speed < 20) return 'gentle';
  if (speed < 35) return 'breezy';
  if (speed < 50) return 'strong';
  return 'severe';
}

export function rainLevel(precipitationMm: number | undefined): RainLevel {
  const mm = precipitationMm ?? 0;
  if (mm <= 0) return 'none';
  if (mm < 0.5) return 'light';
  if (mm < 4) return 'moderate';
  return 'heavy';
}

// Short (1-3 word) i18next keys for tight spaces — list rows, table cells.
export const WIND_LEVEL_LABEL_KEYS: Record<WindLevel, string> = {
  calm: 'wind.calm.label',
  gentle: 'wind.gentle.label',
  breezy: 'wind.breezy.label',
  strong: 'wind.strong.label',
  severe: 'wind.severe.label',
};

export const RAIN_LEVEL_LABEL_KEYS: Record<RainLevel, string> = {
  none: 'rain.none.label',
  light: 'rain.light.label',
  moderate: 'rain.moderate.label',
  heavy: 'rain.heavy.label',
};

// Full-sentence i18next keys with a safety qualifier, for prose contexts
// (Today's daily summary, warnings) — wired up when those screens are built.
export const WIND_LEVEL_SENTENCE_KEYS: Record<WindLevel, string> = {
  calm: 'wind.calm.sentence',
  gentle: 'wind.gentle.sentence',
  breezy: 'wind.breezy.sentence',
  strong: 'wind.strong.sentence',
  severe: 'wind.severe.sentence',
};

export const RAIN_LEVEL_SENTENCE_KEYS: Record<RainLevel, string> = {
  none: 'rain.none.sentence',
  light: 'rain.light.sentence',
  moderate: 'rain.moderate.sentence',
  heavy: 'rain.heavy.sentence',
};
