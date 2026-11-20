import { DateTime } from 'luxon';

import { ForecastRecord, ForecastStepRecord } from './types';
import { CONDITION_LABEL_KEYS, ConditionBucket, conditionBucket, describeConditions } from './day-parts';
import { rainLevel } from './plain-language';

// The day-detail screen (Five Days › a day), built only from the steps the
// provider sent for that day. Providers thin out further ahead (hourly or
// 3-hourly, then 6-hourly, then 12-hourly, sometimes one step on the last
// day), so everything here follows the steps' own length: no provider or
// country settings, and no value taken from outside its own time window.

export type DetailStep = {
  start: string;        // ISO, in the place's time zone
  end: string;          // start of the next step, or start + the step's period
  symbol: string;
  temp?: number;        // °C
  rain?: number;        // mm over `period`; undefined when the provider sent none
  windSpeed?: number;   // m/s
  windFrom?: number;    // degrees the wind blows from
  period?: number;      // hours `symbol` and `rain` describe
};

type Translate = (key: string, options?: Record<string, unknown>) => string;

const parse = (iso: string) => DateTime.fromISO(iso, { setZone: true });
const hoursBetween = (start: string, end: string) => parse(end).diff(parse(start), 'hours').hours;

// Every step of the forecast in time order, across days, so a day's last
// step can end where the next day's first one starts.
export function forecastSeries(forecast: ForecastRecord): ForecastStepRecord[] {
  return forecast.days
    .flatMap(day => day.steps)
    .slice()
    .sort((a, b) => DateTime.fromISO(a.time).toMillis() - DateTime.fromISO(b.time).toMillis());
}

// The steps that start on `date` in the place's time zone `tz`.
export function stepsForDay(series: ForecastStepRecord[], date: DateTime | string, tz: string): DetailStep[] {
  const target = (typeof date === 'string' ? DateTime.fromISO(date, { zone: tz }) : date.setZone(tz)).toISODate();
  const sorted = series
    .map(step => ({ step, start: DateTime.fromISO(step.time).setZone(tz) }))
    .sort((a, b) => a.start.toMillis() - b.start.toMillis());

  const result: DetailStep[] = [];
  sorted.forEach(({ step, start }, i) => {
    if (start.toISODate() !== target) return;
    const next = sorted[i + 1]?.start;
    const previous = sorted[i - 1]?.start;
    // The last step of the forecast: its own period, else the gap before it.
    const fallbackHours = step.period ?? (previous ? start.diff(previous, 'hours').hours : 1);
    const end = next ?? start.plus({ hours: fallbackHours });
    result.push({
      start: start.toISO()!,
      end: end.toISO()!,
      symbol: step.weatherSymbol,
      temp: step.temperature,
      rain: typeof step.precipitation === 'number' ? step.precipitation : undefined,
      windSpeed: step.windSpeed,
      windFrom: step.windDirection,
      period: step.period,
    });
  });
  return result;
}

// --- resolution ---------------------------------------------------------------

export type DayResolution = 1 | 3 | 6 | 12 | 'single';
const RESOLUTIONS = [1, 3, 6, 12] as const;

// Snaps a step length to 1, 3, 6 or 12 hours (the next one up; longer than
// 12 counts as 12).
const snap = (hours: number) => RESOLUTIONS.find(r => Math.round(hours) <= r) ?? 12;

// Step length in hours, or 'single' for a day with one step. A day that
// mixes lengths (e.g. hourly until midday, then 6-hourly) takes the longest.
export function dayResolution(steps: DetailStep[]): DayResolution {
  if (steps.length <= 1) return 'single';
  return snap(Math.max(...steps.map(s => hoursBetween(s.start, s.end))));
}

// Shortest step length, for an honest table title on mixed days
// ("Every 1–6 hours").
export function shortestStep(steps: DetailStep[]): number | undefined {
  if (steps.length === 0) return undefined;
  return snap(Math.min(...steps.map(s => hoursBetween(s.start, s.end))));
}

// --- symbols ------------------------------------------------------------------

// Least to most significant. A part or day takes its most significant
// symbol: rain above cloud, cloud above clear; snow and sleet above rain;
// thunder above everything. Showers rank with rain of the same intensity
// (conditionBucket maps "rainshowers" to "rain").
export const SYMBOL_SIGNIFICANCE: ConditionBucket[] = [
  'clear', 'fair', 'partlycloudy', 'cloudy', 'fog',
  'lightrain', 'rain', 'heavyrain',
  'lightsleet', 'sleet', 'heavysleet',
  'lightsnow', 'snow', 'heavysnow',
  'thunder',
];

// Unknown symbols ("??", or none) never win over a known one.
export function symbolSignificance(symbol: string | undefined): number {
  if (!symbol || symbol === '??') return -1;
  return SYMBOL_SIGNIFICANCE.indexOf(conditionBucket(symbol));
}

// The most significant symbol; the earliest one wins a tie.
export function dominantSymbol(steps: DetailStep[]): string | undefined {
  let best: DetailStep | undefined;
  for (const step of steps) {
    if (symbolSignificance(step.symbol) < 0) continue;
    if (!best || symbolSignificance(step.symbol) > symbolSignificance(best.symbol)) best = step;
  }
  return best?.symbol;
}

// --- rain ---------------------------------------------------------------------

// Total rain over the steps, in mm; undefined when none of them has an
// amount. Amounts are only added when each covers no more than its own
// step: 6-hour amounts on 3-hourly steps overlap, and adding them would
// count the same rain twice, so then the largest single amount is used.
export function totalRain(steps: DetailStep[]): number | undefined {
  const withRain = steps.filter(s => s.rain !== undefined);
  if (withRain.length === 0) return undefined;
  const overlaps = withRain.some(s => s.period !== undefined && s.period > hoursBetween(s.start, s.end) + 0.01);
  const amounts = withRain.map(s => s.rain!);
  return overlaps ? Math.max(...amounts) : amounts.reduce((sum, mm) => sum + mm, 0);
}

// --- temperatures -------------------------------------------------------------

const temperatures = (steps: DetailStep[]) =>
  steps.map(s => s.temp).filter((t): t is number => t !== undefined && Number.isFinite(t));

// --- day parts ----------------------------------------------------------------

export type DetailPartName = 'night' | 'morning' | 'afternoon' | 'evening' | 'day';

export type DetailPart = {
  name: DetailPartName;
  startHour: number;    // 0–23, local
  endHour: number;      // 0–24, local; Night in the two-part split is 18 → 6
  steps: DetailStep[];
  tempMin?: number;     // °C; equal to tempMax for a single step
  tempMax?: number;
  symbol?: string;
  rain?: number;        // mm, see totalRain
};

type PartWindow = { name: DetailPartName; hours: [number, number][]; startHour: number; endHour: number };

const FOUR_PARTS: PartWindow[] = [
  { name: 'night', hours: [[0, 6]], startHour: 0, endHour: 6 },
  { name: 'morning', hours: [[6, 12]], startHour: 6, endHour: 12 },
  { name: 'afternoon', hours: [[12, 18]], startHour: 12, endHour: 18 },
  { name: 'evening', hours: [[18, 24]], startHour: 18, endHour: 24 },
];

// Night covers both ends of the date: 18–24 and 00–06.
const TWO_PARTS: PartWindow[] = [
  { name: 'day', hours: [[6, 18]], startHour: 6, endHour: 18 },
  { name: 'night', hours: [[18, 24], [0, 6]], startHour: 18, endHour: 6 },
];

export const DETAIL_PART_LABEL_KEYS: Record<DetailPartName, string> = {
  night: 'time.periods.night',
  morning: 'time.periods.morning',
  afternoon: 'time.periods.afternoon',
  evening: 'time.periods.evening',
  day: 'time.periods.day',
};

const startHour = (step: DetailStep) => parse(step.start).hour;

// A step belongs to the part its start falls in, and to no other.
const stepsIn = (steps: DetailStep[], window: PartWindow) =>
  steps.filter(step => window.hours.some(([from, to]) => startHour(step) >= from && startHour(step) < to));

function summarisePart(window: PartWindow, steps: DetailStep[]): DetailPart {
  const temps = temperatures(steps);
  return {
    name: window.name,
    startHour: window.startHour,
    endHour: window.endHour,
    steps,
    tempMin: temps.length ? Math.min(...temps) : undefined,
    tempMax: temps.length ? Math.max(...temps) : undefined,
    symbol: dominantSymbol(steps),
    rain: totalRain(steps),
  };
}

// Four parts when every one has a step, else Day and Night when both have
// one, else none (a single step, or steps all in one half of the day).
export function dayParts(steps: DetailStep[]): DetailPart[] {
  if (steps.length <= 1) return [];
  for (const windows of [FOUR_PARTS, TWO_PARTS]) {
    const grouped = windows.map(window => ({ window, steps: stepsIn(steps, window) }));
    if (grouped.every(g => g.steps.length > 0)) {
      return grouped.map(g => summarisePart(g.window, g.steps));
    }
  }
  return [];
}

// --- summary ------------------------------------------------------------------

export type DaySummary =
  | { kind: 'range'; low?: number; high?: number; rain?: number; symbol?: string; windSpeed?: number; steps: DetailStep[] }
  | { kind: 'single'; temp?: number; start: string; end: string; rain?: number; symbol?: string; windSpeed?: number };

// High and low only with two or more steps; one step gives its own value
// and the period it covers.
export function daySummary(steps: DetailStep[]): DaySummary | undefined {
  if (steps.length === 0) return undefined;
  const winds = steps.map(s => s.windSpeed).filter((w): w is number => w !== undefined);
  const windSpeed = winds.length ? Math.max(...winds) : undefined;
  if (steps.length === 1) {
    const [only] = steps;
    return { kind: 'single', temp: only.temp, start: only.start, end: only.end, rain: only.rain, symbol: only.symbol, windSpeed };
  }
  const temps = temperatures(steps);
  return {
    kind: 'range',
    low: temps.length ? Math.min(...temps) : undefined,
    high: temps.length ? Math.max(...temps) : undefined,
    rain: totalRain(steps),
    symbol: dominantSymbol(steps),
    windSpeed,
    steps,
  };
}

// "12:00–18:00", in the steps' own time zone. Midnight at the end reads 00:00.
export function timeRangeLabel(start: string, end: string): string {
  return `${parse(start).toFormat('HH:mm')}–${parse(end).toFormat('HH:mm')}`;
}

// The part's window as "12:00–18:00" ("18:00–06:00" for Night in the
// two-part split).
export function partRangeLabel(part: Pick<DetailPart, 'startHour' | 'endHour'>): string {
  const hh = (hour: number) => `${String(hour % 24).padStart(2, '0')}:00`;
  return `${hh(part.startHour)}–${hh(part.endHour)}`;
}

// The plain-language line under the summary temperature. Uses the same
// sentence as the Five Days list ("Partly cloudy. Light rain expected."),
// built from this day's own steps; a single step gives its condition and
// period ("Partly cloudy, 12:00–18:00").
export function summaryLine(t: Translate, summary: DaySummary): string {
  if (summary.kind === 'single') {
    const condition = t(CONDITION_LABEL_KEYS[conditionBucket(summary.symbol)]);
    return t('dayDetail.singleLine', { condition, range: timeRangeLabel(summary.start, summary.end) });
  }
  const wettestStep = Math.max(0, ...summary.steps.map(s => s.rain ?? 0));
  return describeConditions(t, summary.symbol, summary.windSpeed, rainLevel(wettestStep));
}

// --- table --------------------------------------------------------------------

export type TableRow = DetailStep & { label: string };

// One row per step, labelled with its range. Null for 12-hourly and
// single-step days, where the rows would only repeat the day parts.
export function tableRows(steps: DetailStep[]): TableRow[] | null {
  const resolution = dayResolution(steps);
  if (resolution === 12 || resolution === 'single') return null;
  return steps.map(step => ({ ...step, label: timeRangeLabel(step.start, step.end) }));
}

// The grey note shown instead of a table.
export type DayDetailNote = 'coarse' | 'single';

export function dayDetailNote(steps: DetailStep[]): DayDetailNote | undefined {
  const resolution = dayResolution(steps);
  if (resolution === 'single') return 'single';
  if (resolution === 12) return 'coarse';
  return undefined;
}
