import { WindUnit, formatWind, roundWind } from '@/lib/units';
import { Translate, compassLabelKey, compassPoint } from './plain-language';

// Today's wind in one factual sentence: where it comes from and how fast,
// in the user's units. No description of the conditions (no Beaufort words,
// "strong", "calm" and so on) and no advice.
//
//   "Wind from the south-east at 18 km/h."
//   "Wind at 18 km/h."        (direction unknown)
//   "Wind speed 0 km/h."      (no wind, so no direction)
//
// The compass helpers are shared with describeWind in plain-language.ts.

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
