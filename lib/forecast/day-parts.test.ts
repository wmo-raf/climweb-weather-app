import { ForecastDayRecord, ForecastStepRecord } from './types';
import { getDayParts } from './day-parts';

// getDayParts reads SPARSE_FORECAST when called, so tests set it on the module.
const config = require('@/config') as { SPARSE_FORECAST: boolean };
const saved = config.SPARSE_FORECAST;
afterAll(() => { config.SPARSE_FORECAST = saved; });

const step = (hour: number, temperature: number, extra: Partial<ForecastStepRecord> = {}): ForecastStepRecord => {
  const time = new Date(2026, 10, 27, hour).toISOString(); // local hour on the test machine
  return { time, temperature, precipitation: 0, weatherSymbol: 'cloudy', ...extra };
};

const day = (steps: ForecastStepRecord[]): ForecastDayRecord => ({ day: '2026-11-27', steps });

describe('getDayParts', () => {
  test('sparse mode: each part is one six-hour block, Evening 18–24 and Night 00–06', () => {
    config.SPARSE_FORECAST = true;
    const parts = getDayParts(day([step(0, 19, { period: 6 }), step(6, 24, { period: 6 }), step(12, 29, { period: 6 }), step(18, 23, { period: 6 })]));
    expect([parts.night?.temperature, parts.morning?.temperature, parts.afternoon?.temperature, parts.evening?.temperature])
      .toEqual([19, 24, 29, 23]);
  });

  test('hourly mode keeps Evening 18–21 and Night 21–24', () => {
    config.SPARSE_FORECAST = false;
    const parts = getDayParts(day([step(19, 25), step(22, 21), step(2, 18)]));
    expect([parts.evening?.temperature, parts.night?.temperature]).toEqual([25, 21]);
  });
});
