import { QueryClient } from '@tanstack/react-query';

import { evictOldestForecastEntry, forecastQueryKey } from './current-forecast.hook';

const seedPoints = (queryClient: QueryClient, count: number, offset = 0) => {
  for (let i = offset; i < offset + count; i++) {
    queryClient.setQueryData(forecastQueryKey(i, i), { days: [] });
  }
};

const forecastKeys = (queryClient: QueryClient) =>
  queryClient.getQueryCache().findAll({ queryKey: ['forecast'] });

describe('evictOldestForecastEntry', () => {
  test('does nothing while at or under the cap', () => {
    const queryClient = new QueryClient();
    seedPoints(queryClient, 10);

    evictOldestForecastEntry(queryClient, 9, 9);

    expect(forecastKeys(queryClient)).toHaveLength(10);
  });

  test('evicts the least-recently-fetched point once an 11th is requested', () => {
    const queryClient = new QueryClient();
    seedPoints(queryClient, 10); // points 0..9, point 0 fetched first (oldest)

    queryClient.setQueryData(forecastQueryKey(10, 10), { days: [] });
    evictOldestForecastEntry(queryClient, 10, 10);

    const remaining = forecastKeys(queryClient);
    expect(remaining).toHaveLength(10);
    expect(remaining.some(q => q.queryKey[1] === 0 && q.queryKey[2] === 0)).toBe(false);
    expect(remaining.some(q => q.queryKey[1] === 10 && q.queryKey[2] === 10)).toBe(true);
  });

  test('never evicts the point that was just requested, even if it is the oldest', () => {
    const queryClient = new QueryClient();
    seedPoints(queryClient, 10); // point 0 is oldest

    evictOldestForecastEntry(queryClient, 0, 0);

    const remaining = forecastKeys(queryClient);
    expect(remaining).toHaveLength(10);
    expect(remaining.some(q => q.queryKey[1] === 0 && q.queryKey[2] === 0)).toBe(true);
  });

  test('leaves other query cache entries (e.g. alerts) untouched', () => {
    const queryClient = new QueryClient();
    seedPoints(queryClient, 10);
    queryClient.setQueryData(['alerts'], []);

    queryClient.setQueryData(forecastQueryKey(10, 10), { days: [] });
    evictOldestForecastEntry(queryClient, 10, 10);

    expect(queryClient.getQueryData(['alerts'])).toEqual([]);
  });
});
