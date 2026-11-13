import { DateTime, Settings } from 'luxon';

import { applyAppTimezone } from './app-timezone';
import { parseYrForecast } from '@/lib/forecast/providers';
import { getFiveDayWindow } from '@/lib/forecast/day-parts';
import { YrForecast } from '@/lib/forecast/types';

// A UTC+3 deployment (Ethiopia/Somaliland), viewed on a phone set to UTC+2.
jest.mock('@/config', () => ({
  ...jest.requireActual('@/config'),
  APP_TIMEZONE: 'Africa/Addis_Ababa',
}));

const DEVICE_ZONE = 'Africa/Blantyre';
const NOW = DateTime.fromISO('2026-11-13T08:30:00Z');

// Hourly steps from 08:00Z on 13 Nov (11:00 in Addis), like met.no's
// response for Wirir that morning.
function forecastFrom(firstStepUtc: string, hours: number): YrForecast {
  const start = DateTime.fromISO(firstStepUtc, { zone: 'utc' });
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [43.2833, 9.55] },
    properties: {
      meta: { updated_at: firstStepUtc, units: { air_temperature: 'celsius', wind_speed: 'm/s', precipitation_amount: 'mm' } },
      timeseries: Array.from({ length: hours }, (_, i) => ({
        time: start.plus({ hours: i }).toISO({ suppressMilliseconds: true })!,
        data: {
          instant: { details: { air_temperature: 20, wind_speed: 3 } },
          next_1_hours: { summary: { symbol_code: 'cloudy' }, details: { precipitation_amount: 0 } },
        },
      })),
    },
  };
}

describe('applyAppTimezone', () => {
  const forecast = parseYrForecast(forecastFrom('2026-11-13T08:00:00Z', 72));

  beforeEach(() => {
    Settings.defaultZone = DEVICE_ZONE;
    Settings.now = () => NOW.toMillis();
  });

  afterAll(() => {
    Settings.defaultZone = 'system';
    Settings.now = () => Date.now();
  });

  test("without it, a phone behind the app zone picks tomorrow's forecast as today", () => {
    const [today] = getFiveDayWindow(forecast, DateTime.now());
    expect(today.day).toBe('2026-11-14T00:00:00.000+03:00');
  });

  test('today is the day the forecast starts, beginning at the first step', () => {
    expect(applyAppTimezone()).toBe(true);

    const [today] = getFiveDayWindow(forecast, DateTime.now());
    expect(today.day).toBe('2026-11-13T00:00:00.000+03:00');
    expect(DateTime.fromISO(today.steps[0].time).hour).toBe(11);
    expect(DateTime.fromISO(today.day).toFormat('ccc')).toBe('Fri');
  });

  test('the Five Days list starts at tomorrow, labelled with its own weekday', () => {
    applyAppTimezone();

    const [tomorrow] = getFiveDayWindow(forecast, DateTime.now().plus({ days: 1 }));
    expect(tomorrow.day).toBe('2026-11-14T00:00:00.000+03:00');
    expect(DateTime.fromISO(tomorrow.day).toFormat('ccc')).toBe('Sat');
    expect(DateTime.fromISO(tomorrow.steps[0].time).hour).toBe(0);
  });

  test('an invalid zone leaves the device zone in place', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(applyAppTimezone('Not/AZone')).toBe(false);
    expect(applyAppTimezone('')).toBe(false);
    expect(DateTime.now().zoneName).toBe(DEVICE_ZONE);
    warn.mockRestore();
  });
});
