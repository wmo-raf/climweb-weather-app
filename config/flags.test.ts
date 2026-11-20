// EXPO_PUBLIC_SPARSE_FORECAST is read once, at import.
const loadConfig = (env: Record<string, string | undefined>) => {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  for (const [key, value] of Object.entries(env)) if (value === undefined) delete process.env[key];
  let config!: typeof import('./index');
  jest.isolateModules(() => { config = require('./index'); });
  process.env = saved;
  return config;
};

const SPARSE = 'EXPO_PUBLIC_SPARSE_FORECAST';

describe('SPARSE_FORECAST', () => {
  test('is on by default', () => {
    expect(loadConfig({ [SPARSE]: undefined }).SPARSE_FORECAST).toBe(true);
  });

  test('reads "true" and "false" in any case, with spaces', () => {
    expect(loadConfig({ [SPARSE]: ' FALSE ' }).SPARSE_FORECAST).toBe(false);
    expect(loadConfig({ [SPARSE]: 'True' }).SPARSE_FORECAST).toBe(true);
  });

  test('keeps the default for anything else', () => {
    expect(loadConfig({ [SPARSE]: 'no' }).SPARSE_FORECAST).toBe(true);
    expect(loadConfig({ [SPARSE]: '' }).SPARSE_FORECAST).toBe(true);
  });

  test('warns in development when the old Today flags are still set', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    loadConfig({ EXPO_PUBLIC_SHOW_TODAY_WIND_AND_SUN: 'true' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('EXPO_PUBLIC_SPARSE_FORECAST'));
    warn.mockRestore();
  });
});
