import englishFile from '@/lib/localization/translations/english.json';
import { beaufortForce, compassPoint, describeWind } from './plain-language';

const en = englishFile.translations;

// Resolves keys against english.json, with {{var}} interpolation.
const t = (key: string, options: Record<string, unknown> = {}): string => {
  const value = key.split('.').reduce<any>((obj, k) => obj?.[k], en);
  if (typeof value !== 'string') return key;
  return value.replace(/{{(\w+)}}/g, (_, name) => String(options[name]));
};

describe('beaufortForce', () => {
  test.each([
    [0, 0], [0.49, 0], [0.5, 1], [1.5, 1], [3.3, 2], [5.4, 3], [7.9, 4],
    [10.7, 5], [10.8, 6], [13.8, 6], [17.1, 7], [20.7, 8], [24.4, 9],
    [28.4, 10], [32.6, 11], [32.7, 12], [50, 12],
  ])('%p m/s is force %p', (speed, force) => {
    expect(beaufortForce(speed)).toBe(force);
  });

  test('every force has an English and Swahili label', () => {
    const sw = require('@/lib/localization/translations/swahili.json').translations;
    for (let force = 0; force <= 12; force++) {
      expect(typeof (en as any).beaufort[force]).toBe('string');
      expect(typeof sw.beaufort[force]).toBe('string');
    }
  });
});

describe('compassPoint', () => {
  test.each([
    [0, 'n'], [22, 'n'], [23, 'ne'], [45, 'ne'], [90, 'e'], [135, 'se'],
    [180, 's'], [225, 'sw'], [270, 'w'], [315, 'nw'], [338, 'n'], [360, 'n'], [-45, 'nw'],
  ])('%p° is %p', (degrees, point) => {
    expect(compassPoint(degrees)).toBe(point);
  });
});

describe('describeWind', () => {
  test('names the band and the direction the wind comes from', () => {
    expect(describeWind(t, 12, 135)).toBe('Strong wind from the south-east');
    expect(describeWind(t, 4, 0)).toBe('Gentle wind from the north');
  });

  test('leaves out the direction when it is unknown', () => {
    expect(describeWind(t, 12)).toBe('Strong wind');
  });

  test('calm air has no direction', () => {
    expect(describeWind(t, 0.2, 90)).toBe('Calm');
  });

  test('gale-force wind', () => {
    expect(describeWind(t, 18, 225)).toBe('Gale from the south-west');
  });
});
