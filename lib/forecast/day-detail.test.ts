import i18next from 'i18next';
import { DateTime } from 'luxon';

import english from '@/lib/localization/translations/english.json';
import swahili from '@/lib/localization/translations/swahili.json';
import { ForecastRecord, ForecastStepRecord } from './types';
import {
  DetailStep, dayDetailNote, dayParts, dayResolution, daySummary, dominantSymbol, forecastSeries,
  partRangeLabel, shortestStep, stepsForDay, summaryLine, symbolSignificance, tableRows, timeRangeLabel, totalRain,
} from './day-detail';

const TZ = 'Africa/Dar_es_Salaam'; // UTC+3, no daylight saving

const i18n = i18next.createInstance();
i18n.init({
  resources: { en: { translation: english.translations }, sw: { translation: swahili.translations } },
  lng: 'en',
  fallbackLng: 'en',
  compatibilityJSON: 'v4',
  interpolation: { escapeValue: false },
  initAsync: false,
});
const en = i18n.getFixedT('en');
const sw = i18n.getFixedT('sw');

type StepInput = Partial<ForecastStepRecord> & { at: string };

// `at` is local time in TZ, e.g. "2026-11-24T06:00".
const step = ({ at, ...rest }: StepInput): ForecastStepRecord => ({
  time: DateTime.fromISO(at, { zone: TZ }).toISO()!,
  temperature: 20,
  windSpeed: 4,
  windDirection: 135,
  precipitation: 0,
  weatherSymbol: 'partlycloudy_day',
  period: 1,
  ...rest,
});

// Steps every `every` hours from `from` (local hour) on 24 Nov, `count` of them.
const run = (every: number, from: number, count: number, extra: Partial<ForecastStepRecord> = {}) =>
  Array.from({ length: count }, (_, i) => {
    const hour = from + i * every;
    const day = 24 + Math.floor(hour / 24);
    return step({ at: `2026-11-${day}T${String(hour % 24).padStart(2, '0')}:00`, period: every, ...extra });
  });

const DAY = '2026-11-24';

describe('stepsForDay', () => {
  test('keeps the steps that start on the local date', () => {
    const series = [step({ at: '2026-11-23T23:00' }), ...run(6, 0, 4), step({ at: '2026-11-25T00:00', period: 6 })];
    const steps = stepsForDay(series, DAY, TZ);
    expect(steps.map(s => s.start.slice(11, 16))).toEqual(['00:00', '06:00', '12:00', '18:00']);
  });

  test('ends each step where the next starts, the last one after its period', () => {
    const series = run(6, 0, 4);
    const steps = stepsForDay(series, DAY, TZ);
    expect(steps.map(s => timeRangeLabel(s.start, s.end))).toEqual(['00:00–06:00', '06:00–12:00', '12:00–18:00', '18:00–00:00']);
  });

  test('ends the day\'s last step at the next day\'s first one', () => {
    const series = [...run(6, 0, 4), step({ at: '2026-11-25T03:00', period: 6 })];
    expect(timeRangeLabel(stepsForDay(series, DAY, TZ)[3].start, stepsForDay(series, DAY, TZ)[3].end)).toBe('18:00–03:00');
  });

  test('puts a step at 21:00 UTC on the next local day', () => {
    const late = { ...step({ at: '2026-11-24T00:00' }), time: '2026-11-23T21:00:00.000Z' };
    expect(stepsForDay([late], '2026-11-23', TZ)).toEqual([]);
    expect(stepsForDay([late], DAY, TZ).map(s => s.start)).toEqual(['2026-11-24T00:00:00.000+03:00']);
  });

  test('accepts a DateTime and reads the steps\' fields', () => {
    const [s] = stepsForDay([step({ at: '2026-11-24T12:00', precipitation: '-', temperature: 24.4 })], DateTime.fromISO(DAY, { zone: TZ }), TZ);
    expect(s).toMatchObject({ symbol: 'partlycloudy_day', temp: 24.4, rain: undefined, windSpeed: 4, windFrom: 135, period: 1 });
  });

  test('falls back to the gap before the last step when it has no period', () => {
    const series = [step({ at: '2026-11-24T06:00', period: undefined }), step({ at: '2026-11-24T12:00', period: undefined })];
    const steps = stepsForDay(series, DAY, TZ);
    expect(timeRangeLabel(steps[1].start, steps[1].end)).toBe('12:00–18:00');
  });

  test('forecastSeries flattens days in time order', () => {
    const forecast: ForecastRecord = { days: [
      { day: '2026-11-25', steps: [step({ at: '2026-11-25T00:00' })] },
      { day: '2026-11-24', steps: [step({ at: '2026-11-24T18:00' })] },
    ] };
    expect(forecastSeries(forecast).map(s => s.time.slice(0, 13))).toEqual(['2026-11-24T18', '2026-11-25T00']);
  });
});

// The four day shapes the screen covers (designs 12a–12d).
const threeHourly = () => stepsForDay(run(3, 0, 9), DAY, TZ);   // 00..21, + 00 next day
const sixHourly = () => stepsForDay(run(6, 0, 5), DAY, TZ);     // 00, 06, 12, 18, + 00
const twelveHourly = () => stepsForDay(run(12, 9, 3), DAY, TZ); // 09, 21, + 09 next day
const singleStep = () => stepsForDay([step({ at: '2026-11-24T12:00', period: 6, temperature: 24 })], DAY, TZ);

describe('dayResolution', () => {
  test.each([
    ['hourly', stepsForDay(run(1, 0, 25), DAY, TZ), 1],
    ['3-hourly', threeHourly(), 3],
    ['6-hourly', sixHourly(), 6],
    ['12-hourly', twelveHourly(), 12],
    ['single step', singleStep(), 'single'],
    ['no steps', [], 'single'],
  ] as const)('%s', (_, steps, expected) => {
    expect(dayResolution(steps as DetailStep[])).toBe(expected);
  });

  test('a mixed day takes the longest step', () => {
    // Hourly until 11:00, then 6-hourly from 12:00.
    const series = [...run(1, 0, 12), ...run(6, 12, 3)];
    const steps = stepsForDay(series, DAY, TZ);
    expect(dayResolution(steps)).toBe(6);
    expect(shortestStep(steps)).toBe(1);
  });

  test('snaps in-between lengths up', () => {
    expect(dayResolution(stepsForDay(run(2, 0, 13), DAY, TZ))).toBe(3);
    expect(dayResolution(stepsForDay(run(8, 0, 4), DAY, TZ))).toBe(12);
  });
});

describe('dayParts', () => {
  test('3-hourly: four parts, each from its own two steps', () => {
    const temps = [14, 13, 18, 24, 27, 25, 21, 18, 15];
    const series = run(3, 0, 9).map((s, i) => ({ ...s, temperature: temps[i] }));
    const parts = dayParts(stepsForDay(series, DAY, TZ));
    expect(parts.map(p => [p.name, partRangeLabel(p), p.steps.length, p.tempMin, p.tempMax])).toEqual([
      ['night', '00:00–06:00', 2, 13, 14],
      ['morning', '06:00–12:00', 2, 18, 24],
      ['afternoon', '12:00–18:00', 2, 25, 27],
      ['evening', '18:00–00:00', 2, 18, 21],
    ]);
  });

  test('6-hourly: four parts with one value each', () => {
    const parts = dayParts(sixHourly());
    expect(parts.map(p => p.name)).toEqual(['night', 'morning', 'afternoon', 'evening']);
    expect(parts.every(p => p.steps.length === 1 && p.tempMin === p.tempMax)).toBe(true);
  });

  test('12-hourly: Day and Night', () => {
    const parts = dayParts(twelveHourly());
    expect(parts.map(p => [p.name, partRangeLabel(p), p.steps.map(s => s.start.slice(11, 16))])).toEqual([
      ['day', '06:00–18:00', ['09:00']],
      ['night', '18:00–06:00', ['21:00']],
    ]);
  });

  test('a single step gives no parts', () => {
    expect(dayParts(singleStep())).toEqual([]);
  });

  test('today after 15:00: Day and Night, from the remaining steps only', () => {
    const series = run(1, 15, 9, { temperature: 25 });
    series[0] = { ...series[0], temperature: 30 };
    const parts = dayParts(stepsForDay(series, DAY, TZ));
    expect(parts.map(p => [p.name, p.steps.length, p.tempMax])).toEqual([['day', 3, 30], ['night', 6, 25]]);
  });

  test('steps only in one half give no parts', () => {
    expect(dayParts(stepsForDay(run(3, 6, 4), DAY, TZ))).toEqual([]);
  });

  test('a mixed day at a boundary keeps each step in its own part', () => {
    // Hourly 00–11 (rain at 11:00), then 6-hourly from 12:00 (dry).
    const series = [...run(1, 0, 12), ...run(6, 12, 3)];
    series[11] = { ...series[11], precipitation: 2, weatherSymbol: 'rain' };
    const parts = dayParts(stepsForDay(series, DAY, TZ));
    expect(parts.map(p => [p.name, p.steps.length, p.rain, p.symbol])).toEqual([
      ['night', 6, 0, 'partlycloudy_day'],
      ['morning', 6, 2, 'rain'],
      ['afternoon', 1, 0, 'partlycloudy_day'],
      ['evening', 1, 0, 'partlycloudy_day'],
    ]);
  });

  test('never takes a value from a neighbouring part', () => {
    // A hot, wet 05:00 step must stay in Night, not leak into Morning.
    const series = run(1, 0, 24);
    series[5] = { ...series[5], temperature: 40, precipitation: 9, weatherSymbol: 'heavyrain' };
    const morning = dayParts(stepsForDay(series, DAY, TZ)).find(p => p.name === 'morning')!;
    expect([morning.tempMax, morning.rain, morning.symbol]).toEqual([20, 0, 'partlycloudy_day']);
  });
});

describe('symbols', () => {
  test('rain outranks cloud, cloud outranks clear, thunder outranks all', () => {
    const order = ['clearsky_day', 'fair_day', 'partlycloudy_day', 'cloudy', 'fog', 'lightrainshowers_day', 'rain', 'heavyrain', 'sleet', 'snow', 'heavyrainandthunder'];
    const ranks = order.map(symbolSignificance);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
    expect(symbolSignificance('rainshowers_day')).toBe(symbolSignificance('rain'));
  });

  test('unknown symbols never win; ties go to the earliest', () => {
    const at = (symbol: string, hour: number) => ({ start: `2026-11-24T${hour}:00`, end: '', symbol }) as DetailStep;
    expect(dominantSymbol([at('??', 10), at('clearsky_day', 11)])).toBe('clearsky_day');
    expect(dominantSymbol([at('rainshowers_day', 10), at('rain', 11)])).toBe('rainshowers_day');
    expect(dominantSymbol([at('??', 10)])).toBeUndefined();
  });
});

describe('totalRain', () => {
  test('adds amounts that each cover their own step', () => {
    const series = run(3, 0, 8, { precipitation: 0.5, period: 3 });
    expect(totalRain(stepsForDay(series, DAY, TZ))).toBeCloseTo(4);
  });

  test('takes the largest when the periods overlap (6-hour amounts every 3 hours)', () => {
    const series = run(3, 0, 4, { period: 6 }).map((s, i) => ({ ...s, precipitation: [1, 2, 0.5, 0][i] }));
    expect(totalRain(stepsForDay(series, DAY, TZ))).toBe(2);
  });

  test('is undefined when no step has an amount', () => {
    expect(totalRain(twelveHourly().map(s => ({ ...s, rain: undefined })))).toBeUndefined();
  });
});

describe('daySummary and summaryLine', () => {
  test('a range for two or more steps', () => {
    const series = run(6, 0, 4).map((s, i) => ({ ...s, temperature: [16, 22, 27, 20][i], precipitation: [0, 0, 1.2, 0][i], weatherSymbol: i === 2 ? 'lightrainshowers_day' : 'partlycloudy_day' }));
    const summary = daySummary(stepsForDay(series, DAY, TZ))!;
    expect(summary).toMatchObject({ kind: 'range', low: 16, high: 27, symbol: 'lightrainshowers_day' });
    expect(summary.kind === 'range' && summary.rain).toBeCloseTo(1.2);
    expect(summaryLine(en, summary)).toBe('Light rain.');
  });

  test('a dry day says so', () => {
    expect(summaryLine(en, daySummary(sixHourly())!)).toBe('Partly cloudy. No rain expected.');
  });

  test('one step gives its value and period', () => {
    const summary = daySummary(singleStep())!;
    expect(summary).toMatchObject({ kind: 'single', temp: 24 });
    expect(summaryLine(en, summary)).toBe('Partly cloudy, 12:00–18:00');
    expect(summaryLine(sw, summary)).toBe('Mawingu kiasi, 12:00–18:00');
  });

  test('no steps, no summary', () => {
    expect(daySummary([])).toBeUndefined();
  });
});

describe('tableRows and notes', () => {
  test('3-hourly: eight rows labelled with ranges', () => {
    const rows = tableRows(threeHourly())!;
    expect(rows).toHaveLength(8);
    expect(rows[0].label).toBe('00:00–03:00');
    expect(rows[7].label).toBe('21:00–00:00');
    expect(dayDetailNote(threeHourly())).toBeUndefined();
  });

  test('6-hourly: four rows', () => {
    expect(tableRows(sixHourly())!.map(r => r.label)).toEqual(['00:00–06:00', '06:00–12:00', '12:00–18:00', '18:00–00:00']);
  });

  test('12-hourly: no table, the "less detail" note', () => {
    expect(tableRows(twelveHourly())).toBeNull();
    expect(dayDetailNote(twelveHourly())).toBe('coarse');
  });

  test('single step: no table, the "one time" note', () => {
    expect(tableRows(singleStep())).toBeNull();
    expect(dayDetailNote(singleStep())).toBe('single');
  });
});
