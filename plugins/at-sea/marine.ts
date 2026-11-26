import { DateTime } from 'luxon';
import { distance, point } from '@turf/turf';

import { ForecastStepRecord } from '@/lib/forecast/types';
import { DetailStep, dominantSymbol, stepsForDay } from '@/lib/forecast/day-detail';
import { convertWind } from '@/lib/units';

import { MARINE_AREAS, MARINE_THRESHOLDS, MarineArea, MarineThresholds, WaterType } from './settings';

// The At sea page's day: four parts, each with its sky, a wind word and an
// advisory, and one banner for the whole day. Words only: no numbers, units
// or compass directions reach the screen.

export type Translate = (key: string, options?: Record<string, unknown>) => string;

// --- marine area ---------------------------------------------------------------

// An area's name in `language` ("sw", "sw-TZ"), else English, else its id.
export function areaName(area: MarineArea, language: string | undefined): string {
  const code = (language ?? '').split(/[-_]/)[0].toLowerCase();
  return area.name[code] ?? area.name.en ?? area.id;
}

// The area nearest to a place, or the first one with no place. Undefined
// only when no areas are configured.
export function nearestArea(place: { lat: number; lon: number } | undefined, areas: MarineArea[] = MARINE_AREAS): MarineArea | undefined {
  if (!place) return areas[0];
  const from = point([place.lon, place.lat]);
  let best: MarineArea | undefined;
  let bestKm = Infinity;
  for (const area of areas) {
    const km = distance(from, point([area.lon, area.lat]));
    if (km < bestKm) { best = area; bestKm = km; }
  }
  return best;
}

// The area the user picked, when it's still configured; else the nearest.
export function selectedArea(chosenId: string | undefined, place: { lat: number; lon: number } | undefined, areas: MarineArea[] = MARINE_AREAS): MarineArea | undefined {
  return areas.find(area => area.id === chosenId) ?? nearestArea(place, areas);
}

// Lower case, without accents, so "dar es" finds "Dar es Salaam coast".
const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

// The areas whose name, in the user's language, contains every word typed,
// in list order. An empty search lists them all.
export function matchAreas(query: string, areas: MarineArea[], nameOf: (area: MarineArea) => string): MarineArea[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return areas;
  return areas.filter(area => {
    const name = fold(nameOf(area));
    return words.every(word => name.includes(word));
  });
}

// Suggestions before anything is typed, and at most while typing.
export const DEFAULT_SUGGESTIONS = 3;
export const MAX_SUGGESTIONS = 4;

// What the search shows: the matching areas, nearest `origin` first (list
// order without one): three before anything is typed, at most four after.
export function suggestAreas(
  query: string,
  areas: MarineArea[],
  nameOf: (area: MarineArea) => string,
  origin?: { lat: number; lon: number },
  limit = query.trim() ? MAX_SUGGESTIONS : DEFAULT_SUGGESTIONS,
): MarineArea[] {
  // A copy: an empty search returns `areas` itself, which mustn't be reordered.
  const matches = [...matchAreas(query, areas, nameOf)];
  if (origin) {
    const from = point([origin.lon, origin.lat]);
    const km = new Map(matches.map(area => [area.id, distance(from, point([area.lon, area.lat]))]));
    matches.sort((a, b) => km.get(a.id)! - km.get(b.id)!);
  }
  return matches.slice(0, limit);
}

// --- parts of the day ----------------------------------------------------------

export type MarinePartName = 'morning' | 'afternoon' | 'evening' | 'night';

// In page order. Night is the one after the evening: 00–06 on the next date.
const PART_WINDOWS: { name: MarinePartName; from: number; to: number; nextDay?: boolean }[] = [
  { name: 'morning', from: 6, to: 12 },
  { name: 'afternoon', from: 12, to: 18 },
  { name: 'evening', from: 18, to: 24 },
  { name: 'night', from: 0, to: 6, nextDay: true },
];

export type MarinePart = {
  name: MarinePartName;
  start: string;        // ISO, the window's start in the place's time zone
  end: string;          // ISO, the window's end
  steps: DetailStep[];  // the steps that start inside the window
};

// Morning 06–12, Afternoon 12–18, Evening 18–00 and Night 00–06 (the night
// after the evening), in time zone `tz`. A part takes only the steps that
// start inside it. With `now`, steps that have already ended are left out,
// so a part that is over (Morning after 12:00) has none. A part with no
// steps is null.
export function partsOfDay(
  series: ForecastStepRecord[],
  date: DateTime | string,
  tz: string,
  now?: DateTime,
): (MarinePart | null)[] {
  const day = (typeof date === 'string' ? DateTime.fromISO(date, { zone: tz }) : date.setZone(tz)).startOf('day');
  const steps = [...stepsForDay(series, day, tz), ...stepsForDay(series, day.plus({ days: 1 }), tz)]
    .filter(step => !now || DateTime.fromISO(step.end) > now);

  return PART_WINDOWS.map(({ name, from, to, nextDay }) => {
    const base = nextDay ? day.plus({ days: 1 }) : day;
    const start = base.plus({ hours: from });
    const end = base.plus({ hours: to });
    const inside = steps.filter(step => {
      const t = DateTime.fromISO(step.start);
      return t >= start && t < end;
    });
    return inside.length ? { name, start: start.toISO()!, end: end.toISO()!, steps: inside } : null;
  });
}

// --- wind ----------------------------------------------------------------------

export type WindBand = 'light' | 'moderate' | 'strong';

// Knots to one decimal: forecasts come in m/s, and 10 kt converted to m/s
// and back is 9.99999…, which must still count as 10.
export const toKnots = (metresPerSecond: number) => Math.round(convertWind(metresPerSecond, 'knots') * 10) / 10;

// The highest wind in the part, in knots, against the water type's
// thresholds. Undefined when no step has a wind speed.
export function windBand(steps: DetailStep[], waterType: WaterType, thresholds: MarineThresholds = MARINE_THRESHOLDS): WindBand | undefined {
  const speeds = steps.map(s => s.windSpeed).filter((w): w is number => w !== undefined && Number.isFinite(w));
  if (!speeds.length) return undefined;
  const knots = toKnots(Math.max(...speeds));
  const { moderate, strong } = thresholds.wind_kt[waterType];
  if (knots >= strong) return 'strong';
  if (knots >= moderate) return 'moderate';
  return 'light';
}

// --- sky -----------------------------------------------------------------------

// Night icon where the symbol has one ("fair_day" → "fair_night").
export const nightSymbol = (symbol: string) => symbol.replace(/_(day|polartwilight)$/, '_night');

// The symbol and its own name: the language files name every symbol code
// ("partlycloudy_day" → "Partly cloudy"), with no grouping into fewer words.
export type Sky = { symbol: string; labelKey: string };

// The most significant weather in the part, by the app's symbol ranking
// (lib/forecast/day-detail SYMBOL_SIGNIFICANCE: rain above cloud above
// clear, heavier rain above lighter, thunder above all); the earlier step
// wins a tie. The Night part uses night icons. Undefined when no step has a
// known symbol.
export function skyForPart(steps: DetailStep[], partName?: MarinePartName): Sky | undefined {
  const best = dominantSymbol(steps);
  if (best === undefined) return undefined;
  const symbol = partName === 'night' ? nightSymbol(best) : best;
  return { symbol, labelKey: symbol };
}

// --- rain ----------------------------------------------------------------------

export type RainBand = 'none' | 'light' | 'moderate' | 'heavy';

export function rainBandFor(mm: number, thresholds: MarineThresholds = MARINE_THRESHOLDS): RainBand {
  const { light, moderate, heavy } = thresholds.rain_24h_mm;
  if (mm >= heavy) return 'heavy';
  if (mm >= moderate) return 'moderate';
  if (mm >= light) return 'light';
  return 'none';
}

// Rain over the 24 hours from `now`, in mm. Each step's amount covers its
// own period (1, 6 or 12 hours) from its start. A block that overlaps one
// already counted is skipped, so 6-hour amounts on 3-hourly steps aren't
// counted twice. A block cut by either end of the window counts in
// proportion. Undefined when no step in the window has an amount.
export function rain24h(series: ForecastStepRecord[], now: DateTime): number | undefined {
  const windowStart = now.toMillis();
  const windowEnd = now.plus({ hours: 24 }).toMillis();
  const sorted = series
    .map(step => ({ step, start: DateTime.fromISO(step.time).toMillis() }))
    .sort((a, b) => a.start - b.start);

  let total: number | undefined;
  let coveredUntil = -Infinity;
  sorted.forEach(({ step, start }, i) => {
    if (typeof step.precipitation !== 'number') return;
    const gap = sorted[i + 1] ? (sorted[i + 1].start - start) / 3_600_000 : 1;
    const end = start + (step.period ?? gap) * 3_600_000;
    if (end <= windowStart || start >= windowEnd || start < coveredUntil) return;
    const overlap = Math.min(end, windowEnd) - Math.max(start, windowStart);
    total = (total ?? 0) + step.precipitation * (overlap / (end - start));
    coveredUntil = end;
  });
  return total;
}

// The rain word for the next 24 hours; undefined when there's no rain data.
export function rainBand24h(series: ForecastStepRecord[], now: DateTime, thresholds: MarineThresholds = MARINE_THRESHOLDS): RainBand | undefined {
  const mm = rain24h(series, now);
  return mm === undefined ? undefined : rainBandFor(mm, thresholds);
}

// --- advisories ----------------------------------------------------------------

export type Advisory = 'okay' | 'takeCare' | 'danger';
const ADVISORY_RANK: Advisory[] = ['okay', 'takeCare', 'danger'];
const worst = (levels: Advisory[]): Advisory =>
  levels.reduce<Advisory>((a, b) => (ADVISORY_RANK.indexOf(b) > ADVISORY_RANK.indexOf(a) ? b : a), 'okay');

export const windAdvisory = (band: WindBand | undefined): Advisory =>
  band === 'strong' ? 'danger' : band === 'moderate' ? 'takeCare' : 'okay';

export const rainAdvisory = (band: RainBand | undefined): Advisory =>
  band === 'heavy' ? 'danger' : band === 'moderate' ? 'takeCare' : 'okay';

// What the page shows for a part: the sky, the wind word and its advisory.
export type PartSummary = {
  name: MarinePartName;
  start: string;
  end: string;
  sky?: Sky;
  wind?: WindBand;
  advisory: Advisory;
};

export function summarisePart(part: MarinePart, waterType: WaterType, thresholds: MarineThresholds = MARINE_THRESHOLDS): PartSummary {
  const wind = windBand(part.steps, waterType, thresholds);
  return {
    name: part.name,
    start: part.start,
    end: part.end,
    sky: skyForPart(part.steps, part.name),
    wind,
    advisory: windAdvisory(wind),
  };
}

// --- banner --------------------------------------------------------------------

export type Banner = { level: Advisory; title: string; line: string };

const PART_ORDER: MarinePartName[] = ['morning', 'afternoon', 'evening', 'night'];

// "this afternoon" / "this afternoon and evening".
function whenPhrase(t: Translate, parts: PartSummary[]): string {
  if (parts.length === 1) return t(`atSea.when.${parts[0].name}`);
  const [a, b] = [...parts].sort((x, y) => PART_ORDER.indexOf(x.name) - PART_ORDER.indexOf(y.name));
  return t(`atSea.when.pair.${a.name}_${b.name}`);
}

// One clock time for a span: "6 am", "6 pm", "noon", "midnight" on a
// 12-hour clock, "18:00" on a 24-hour one (atSea.time.clock in the language
// file). The start drops its am/pm when the end has the same one, as in
// "from 12 to 6 pm".
function spanTimes(t: Translate, start: DateTime, end: DateTime): { start: string; end: string } {
  if (t('atSea.time.clock') !== '12h') {
    return { start: start.toFormat('HH:mm'), end: end.toFormat('HH:mm') };
  }
  const meridiem = (dt: DateTime) => (dt.hour < 12 ? 'am' : 'pm');
  const hour12 = (dt: DateTime) => String(dt.hour % 12 === 0 ? 12 : dt.hour % 12);
  const label = (dt: DateTime, bare: boolean) => {
    if (dt.hour === 0 && dt.minute === 0) return t('atSea.time.midnight');
    if (dt.hour === 12 && dt.minute === 0 && !bare) return t('atSea.time.noon');
    return bare ? hour12(dt) : t(`atSea.time.${meridiem(dt)}`, { hour: hour12(dt) });
  };
  const endIsWord = end.hour === 0 || end.hour === 12;
  const sameHalf = !endIsWord && meridiem(start) === meridiem(end) && start.hour !== 0;
  return { start: label(start, sameHalf), end: label(end, false) };
}

// Parts that follow one another with no gap, e.g. afternoon and evening.
const contiguous = (parts: PartSummary[]) =>
  parts.every((part, i) => i === 0 || DateTime.fromISO(parts[i - 1].end).equals(DateTime.fromISO(part.start)));

// "Strong wind from 12 to 6 pm." / "Strong wind this morning and evening."
function timedSentence(t: Translate, keyBase: string, parts: PartSummary[]): string {
  if (parts.length <= 2 && !contiguous(parts)) return t(`${keyBase}.when`, { when: whenPhrase(t, parts) });
  const span = spanTimes(t, DateTime.fromISO(parts[0].start, { setZone: true }), DateTime.fromISO(parts[parts.length - 1].end, { setZone: true }));
  return t(`${keyBase}.span`, span);
}

const WIND_RANK: WindBand[] = ['light', 'moderate', 'strong'];
const strongestWind = (parts: PartSummary[]): WindBand | undefined =>
  parts.reduce<WindBand | undefined>((a, p) => (p.wind && (!a || WIND_RANK.indexOf(p.wind) > WIND_RANK.indexOf(a)) ? p.wind : a), undefined);

// One advisory for the day, from the parts still to come and the rain over
// the next 24 hours. In order:
// 1. The worst condition wins: the highest part advisory or rain advisory.
// 2. All okay: "Okay all day".
// 3. Parts at that level name the time: one or two by name, three or four
//    "most of the day".
// 4. Only the rain at that level: "{Level} today".
// The line under it gives the wind at the deciding parts with their time
// span, then the rain; rain first when it alone decides; general wind and
// rain words when all is okay. Parts come from summarisePart. Null when
// there is nothing to go on.
export function summaryBanner(t: Translate, parts: (PartSummary | null)[], rain: RainBand | undefined): Banner | null {
  const shown = parts.filter((p): p is PartSummary => p !== null)
    .sort((a, b) => DateTime.fromISO(a.start).toMillis() - DateTime.fromISO(b.start).toMillis());
  if (!shown.length && rain === undefined) return null;

  const rainLevel = rainAdvisory(rain);
  const level = worst([...shown.map(p => p.advisory), rainLevel]);
  const generalWind = strongestWind(shown);
  const windWords = generalWind ? t(`atSea.line.wind.${generalWind}`) : undefined;
  const rainWords = rain ? t(`atSea.line.rain.${rain}`) : undefined;
  const join = (...sentences: (string | undefined)[]) => sentences.filter(Boolean).join(' ');

  if (level === 'okay') {
    return { level, title: t('atSea.banner.okay'), line: join(windWords, rainWords) };
  }

  const deciding = shown.filter(p => p.advisory === level);
  if (deciding.length) {
    const title = deciding.length >= 3
      ? t(`atSea.banner.mostOfDay.${level}`)
      : t(`atSea.banner.when.${level}`, { when: whenPhrase(t, deciding) });
    // A part's advisory comes from its wind, so all deciding parts share one wind word.
    const lead = timedSentence(t, `atSea.line.windAt.${deciding[0].wind}`, deciding);
    return { level, title, line: join(lead, rainWords) };
  }

  // Only the rain is at the winning level.
  return { level, title: t(`atSea.banner.today.${level}`), line: join(t(`atSea.line.rainExpected.${rain}`), windWords) };
}
