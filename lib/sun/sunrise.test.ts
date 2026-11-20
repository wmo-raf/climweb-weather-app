import Axios from 'axios';

import { daylightMinutes, getSunTimes, parseSunriseResponse, utcOffset } from './sunrise';

jest.mock('axios');
const mockStore = new Map<string, string>();
jest.mock('@/lib/storage', () => ({
  jsonStorage: {
    getItem: (key: string) => mockStore.get(key) ?? null,
    setItem: (key: string, value: string) => { mockStore.set(key, value); },
    removeItem: (key: string) => { mockStore.delete(key); },
  },
}));

const mockedGet = Axios.get as jest.Mock;

// Trimmed from a real api.met.no/weatherapi/sunrise/3.0/sun response.
const darEsSalaam = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [39.28, -6.8] },
  properties: {
    body: 'Sun',
    sunrise: { time: '2026-11-02T05:55+03:00', azimuth: 104.93 },
    sunset: { time: '2026-11-02T18:17+03:00', azimuth: 254.91 },
    solarnoon: { time: '2026-11-02T12:06+03:00', disc_centre_elevation: 82.0, visible: true },
  },
};

// Polar night (Svalbard, December): no sunrise or sunset.
const polarNight = {
  properties: {
    body: 'Sun',
    sunrise: { time: null, azimuth: null },
    sunset: { time: null, azimuth: null },
  },
};

describe('parseSunriseResponse', () => {
  test('reads sunrise and sunset times from properties', () => {
    expect(parseSunriseResponse(darEsSalaam)).toEqual({
      sunrise: '2026-11-02T05:55+03:00',
      sunset: '2026-11-02T18:17+03:00',
    });
  });

  test('null event times come back as null', () => {
    expect(parseSunriseResponse(polarNight)).toEqual({ sunrise: null, sunset: null });
  });

  test('a missing event or an unparseable time is null too', () => {
    expect(parseSunriseResponse({ properties: { sunrise: { time: 'soon' } } })).toEqual({ sunrise: null, sunset: null });
    expect(parseSunriseResponse({} as any)).toEqual({ sunrise: null, sunset: null });
  });
});

describe('daylightMinutes', () => {
  test('is sunset minus sunrise', () => {
    expect(daylightMinutes(parseSunriseResponse(darEsSalaam))).toBe(12 * 60 + 22);
  });

  test('is undefined when either time is null', () => {
    expect(daylightMinutes(parseSunriseResponse(polarNight))).toBeUndefined();
    expect(daylightMinutes({ sunrise: '2026-11-02T05:55+03:00', sunset: null })).toBeUndefined();
  });
});

test('utcOffset gives the zone offset for the date', () => {
  expect(utcOffset('Africa/Dar_es_Salaam', '2026-11-02')).toBe('+03:00');
});

describe('getSunTimes caching', () => {
  const response = (status: number, headers: Record<string, string>, data: unknown = darEsSalaam) =>
    ({ status, headers, data });

  beforeEach(() => {
    mockStore.clear();
    mockedGet.mockReset();
  });

  test('sends the User-Agent, date and offset, and reuses the response until it expires', async () => {
    mockedGet.mockResolvedValueOnce(response(200, {
      expires: new Date(Date.now() + 60_000).toUTCString(),
      'last-modified': 'Mon, 02 Nov 2026 06:47:22 GMT',
    }));

    await getSunTimes(-6.8, 39.28, '2026-11-02', '+03:00');
    const times = await getSunTimes(-6.8, 39.28, '2026-11-02', '+03:00');

    expect(times.sunrise).toBe('2026-11-02T05:55+03:00');
    expect(mockedGet).toHaveBeenCalledTimes(1);
    const [url, config] = mockedGet.mock.calls[0];
    expect(url).toMatch(/\/sun$/);
    expect(config.params).toEqual({ lat: '-6.8000', lon: '39.2800', date: '2026-11-02', offset: '+03:00' });
    expect(config.headers).toHaveProperty('User-Agent');
  });

  test('revalidates an expired entry with If-Modified-Since and keeps it on 304', async () => {
    mockedGet.mockResolvedValueOnce(response(200, {
      expires: new Date(Date.now() - 1000).toUTCString(),
      'last-modified': 'Mon, 02 Nov 2026 06:47:22 GMT',
    }));
    await getSunTimes(-6.8, 39.28, '2026-11-02', '+03:00');

    mockedGet.mockResolvedValueOnce(response(304, { expires: new Date(Date.now() + 60_000).toUTCString() }, ''));
    const times = await getSunTimes(-6.8, 39.28, '2026-11-02', '+03:00');

    expect(mockedGet.mock.calls[1][1].headers['If-Modified-Since']).toBe('Mon, 02 Nov 2026 06:47:22 GMT');
    expect(times.sunset).toBe('2026-11-02T18:17+03:00');
  });

  test('caches per place and date', async () => {
    const later = { expires: new Date(Date.now() + 60_000).toUTCString() };
    mockedGet.mockResolvedValue(response(200, later));

    await getSunTimes(-6.8, 39.28, '2026-11-02', '+03:00');
    await getSunTimes(-5.07, 39.1, '2026-11-02', '+03:00');
    await getSunTimes(-6.8, 39.28, '2026-11-03', '+03:00');

    expect(mockedGet).toHaveBeenCalledTimes(3);
  });

  test('falls back to the cached times offline, and throws with nothing cached', async () => {
    mockedGet.mockResolvedValueOnce(response(200, { expires: new Date(Date.now() - 1000).toUTCString() }));
    await getSunTimes(-6.8, 39.28, '2026-11-02', '+03:00');

    mockedGet.mockRejectedValue(new Error('Network Error'));
    await expect(getSunTimes(-6.8, 39.28, '2026-11-02', '+03:00')).resolves.toMatchObject({ sunrise: '2026-11-02T05:55+03:00' });
    await expect(getSunTimes(-5.07, 39.1, '2026-11-02', '+03:00')).rejects.toThrow('Network Error');
  });
});
