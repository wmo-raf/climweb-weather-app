import Axios from 'axios';

import { requestPolicy } from '@/lib/network/request-policy';
import { YrLocationForecastProvider } from './yr-location-forecast.provider';

jest.mock('axios');
jest.mock('@/config', () => ({
  PRIMARY_API_URL: 'https://primary.example/locationforecast',
  FALLBACK_API_URL: 'https://fallback.example/locationforecast',
  APP_USER_AGENT: 'test-agent',
}));
const mockedGet = Axios.get as jest.Mock;

const FAST = { retries: 3, initialDelay: 1, maxDelay: 2, openFor: 50 };
const FORECAST = { type: 'Feature', properties: { meta: { updated_at: '', units: {} }, timeseries: [] } };
const provider = () => new YrLocationForecastProvider(undefined, undefined, requestPolicy('Forecast API', FAST));
const callsTo = (host: string) => mockedGet.mock.calls.filter(([url]) => url.includes(host));

beforeEach(() => {
  mockedGet.mockReset();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('YrLocationForecastProvider', () => {
  test('asks the primary API for the point, with the User-Agent', async () => {
    mockedGet.mockResolvedValue({ status: 200, data: FORECAST });

    await expect(provider().getForecast(-6.8, 39.28)).resolves.toEqual(FORECAST);
    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(mockedGet.mock.calls[0][0]).toBe('https://primary.example/locationforecast?lat=-6.8000&lon=39.2800');
    expect(mockedGet.mock.calls[0][1].headers['User-Agent']).toBe('test-agent');
  });

  test('a failing primary API is retried three times, then the fallback API answers', async () => {
    mockedGet.mockImplementation(async (url: string) => {
      if (url.includes('primary')) throw new Error('timeout of 5000ms exceeded');
      return { status: 200, data: FORECAST };
    });

    await expect(provider().getForecast(-6.8, 39.28)).resolves.toEqual(FORECAST);
    expect(callsTo('primary')).toHaveLength(4);
    expect(callsTo('fallback')).toHaveLength(1);
  });

  test('a 200 that is not a forecast counts as a failure', async () => {
    mockedGet.mockImplementation(async (url: string) =>
      url.includes('primary') ? { status: 200, data: '<!DOCTYPE html><html>…</html>' } : { status: 200, data: FORECAST });

    await expect(provider().getForecast(-6.8, 39.28)).resolves.toEqual(FORECAST);
    expect(callsTo('primary')).toHaveLength(4);
    expect(callsTo('fallback')).toHaveLength(1);
  });

  test('while the circuit is open, only the fallback API is called', async () => {
    const forecasts = provider();
    mockedGet.mockImplementation(async (url: string) => {
      if (url.includes('primary')) throw new Error('timeout');
      return { status: 200, data: FORECAST };
    });
    await forecasts.getForecast(-6.8, 39.28);
    mockedGet.mockClear();

    await forecasts.getForecast(-5.07, 39.1);
    expect(callsTo('primary')).toHaveLength(0);
    expect(callsTo('fallback')).toHaveLength(1);
  });
});
