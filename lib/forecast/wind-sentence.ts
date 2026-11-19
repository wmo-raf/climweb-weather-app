import { WindUnit, formatWind, roundWind } from '@/lib/units';

// Today's wind in one factual sentence: where it comes from and how fast,
// in the user's units. No description of the conditions (no Beaufort words,
// "strong", "calm" and so on) and no advice.
//
//   "Wind from the south-east at 18 km/h."
//   "Wind at 18 km/h."        (direction unknown)
//   "Wind speed 0 km/h."      (no wind, so no direction)

// 8-point compass, from the direction the wind blows FROM in degrees.
export type CompassPoint = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
const COMPASS_POINTS: CompassPoint[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

// Each point covers 45°, centred on it. A boundary belongs to the sector
// clockwise from it, so north is [337.5°, 22.5°) and 22.5° is north-east.
export function compassPoint(degrees: number): CompassPoint {
  const normalised = ((degrees % 360) + 360) % 360;
  return COMPASS_POINTS[Math.round(normalised / 45) % 8];
}

// i18n key for a point's name, e.g. "south-east".
export const compassLabelKey = (point: CompassPoint): string => `compass.${point}.long`;

export type Translate = (key: string, options?: Record<string, unknown>) => string;

export type WindSentenceOptions = {
  // Units in words ("18 kilometres per hour"), for screen readers.
  spoken?: boolean;
};

const hasDirection = (degrees: number | undefined): degrees is number =>
  typeof degrees === 'number' && Number.isFinite(degrees);

// `speedMs` is canonical m/s; `fromDegrees` is where the wind blows from.
// The zero check uses the rounded figure the user sees, so 0.2 m/s reads
// "Wind speed 0 km/h." rather than giving a direction for 0 km/h.
export function windSentence(
  t: Translate,
  speedMs: number,
  fromDegrees: number | undefined,
  unit: WindUnit,
  { spoken = false }: WindSentenceOptions = {},
): string {
  const value = roundWind(speedMs, unit);
  const speed = spoken ? t(`units.spoken.${unit}`, { count: value }) : formatWind(speedMs, unit);

  if (value === 0) return t('wind.speedZero', { speed });
  if (!hasDirection(fromDegrees)) return t('wind.speedOnly', { speed });
  return t('wind.speedDirection', { direction: t(compassLabelKey(compassPoint(fromDegrees))), speed });
}
