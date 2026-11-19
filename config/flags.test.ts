// The Today section flags read EXPO_PUBLIC_* values once, at import.
const loadConfig = (env: Record<string, string | undefined>) => {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  for (const [key, value] of Object.entries(env)) if (value === undefined) delete process.env[key];
  let config!: typeof import('./index');
  jest.isolateModules(() => { config = require('./index'); });
  process.env = saved;
  return config;
};

const HOURLY = 'EXPO_PUBLIC_SHOW_TODAY_HOURLY_SUMMARY';
const WIND_SUN = 'EXPO_PUBLIC_SHOW_TODAY_WIND_AND_SUN';

describe('Today section flags', () => {
  test('default to wind and sun on, hour by hour off', () => {
    const config = loadConfig({ [HOURLY]: undefined, [WIND_SUN]: undefined });
    expect(config.SHOW_TODAY_HOURLY_SUMMARY).toBe(false);
    expect(config.SHOW_TODAY_WIND_AND_SUN).toBe(true);
  });

  test('read "true" and "false" in any case, with spaces', () => {
    const config = loadConfig({ [HOURLY]: ' TRUE ', [WIND_SUN]: 'False' });
    expect(config.SHOW_TODAY_HOURLY_SUMMARY).toBe(true);
    expect(config.SHOW_TODAY_WIND_AND_SUN).toBe(false);
  });

  test('keep the default for anything else', () => {
    const config = loadConfig({ [HOURLY]: 'yes', [WIND_SUN]: '' });
    expect(config.SHOW_TODAY_HOURLY_SUMMARY).toBe(false);
    expect(config.SHOW_TODAY_WIND_AND_SUN).toBe(true);
  });
});
