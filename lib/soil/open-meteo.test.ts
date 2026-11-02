import { DateTime } from 'luxon';

import { expiryFromHeaders, parseOpenMeteoSoil } from './open-meteo';
import { soilNow } from './soil-data-source';

// Trimmed from a real api.open-meteo.com/v1/forecast response for Dar es Salaam.
const response = {
  utc_offset_seconds: 10800,
  timezone: 'Africa/Dar_es_Salaam',
  hourly_units: { time: 'iso8601', soil_temperature_6cm: '°C', soil_moisture_3_to_9cm: 'm³/m³' },
  hourly: {
    time: ['2026-11-02T08:00', '2026-11-02T09:00', '2026-11-02T10:00'],
    soil_temperature_6cm: [28.2, 30.2, null],
    soil_moisture_3_to_9cm: [0.14, null, 0.15],
  },
};

const parse = (raw: unknown) => parseOpenMeteoSoil(raw as any, 'soil_temperature_6cm', 'soil_moisture_3_to_9cm');

describe('parseOpenMeteoSoil', () => {
  test('reads the configured variables per hour, with local times pinned to the offset', () => {
    expect(parse(response).hours[0]).toEqual({ time: '2026-11-02T08:00:00.000+03:00', temperature: 28.2, moisture: 0.14 });
  });

  test('keeps null values as null', () => {
    const { hours } = parse(response);
    expect(hours[1]).toMatchObject({ temperature: 30.2, moisture: null });
    expect(hours[2]).toMatchObject({ temperature: null, moisture: 0.15 });
  });

  test('a variable missing from the response is null for every hour', () => {
    const { hours } = parseOpenMeteoSoil(response as any, 'soil_temperature_18cm', 'soil_moisture_3_to_9cm');
    expect(hours.every(h => h.temperature === null)).toBe(true);
  });

  test('an empty or malformed response gives no hours', () => {
    expect(parse({}).hours).toEqual([]);
    expect(parse({ hourly: { time: ['not a time'], soil_temperature_6cm: [20] } }).hours).toEqual([]);
  });
});

describe('soilNow', () => {
  const data = parse(response);

  test('picks the hour nearest to now', () => {
    expect(soilNow(data, DateTime.fromISO('2026-11-02T08:20:00+03:00'))).toEqual({ temperature: 28.2, moisture: 0.14 });
    expect(soilNow(data, DateTime.fromISO('2026-11-02T08:40:00+03:00'))).toEqual({ temperature: 30.2, moisture: undefined });
  });

  test('a null at the nearest hour is missing, not borrowed from a neighbour', () => {
    expect(soilNow(data, DateTime.fromISO('2026-11-02T10:00:00+03:00'))).toEqual({ temperature: undefined, moisture: 0.15 });
  });

  test('no data gives nothing', () => {
    expect(soilNow(undefined)).toEqual({});
    expect(soilNow({ hours: [] })).toEqual({});
  });
});

describe('expiryFromHeaders', () => {
  test('uses Cache-Control max-age, then Expires', () => {
    expect(expiryFromHeaders({ 'cache-control': 'public, max-age=900' }, 1_000)).toBe(901_000);
    expect(expiryFromHeaders({ expires: 'Mon, 02 Nov 2026 08:00:00 GMT' })).toBe(Date.parse('Mon, 02 Nov 2026 08:00:00 GMT'));
  });

  test('is undefined when neither is sent (Open-Meteo today)', () => {
    expect(expiryFromHeaders({ 'content-type': 'application/json' })).toBeUndefined();
  });
});
