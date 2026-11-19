import i18next from 'i18next';

import english from '@/lib/localization/translations/english.json';
import swahili from '@/lib/localization/translations/swahili.json';
import { WIND_UNITS } from '@/lib/units';
import { CompassPoint, compassPoint, windSentence } from './wind-sentence';

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

describe('compassPoint', () => {
  // Each sector's centre and the boundaries on either side. A boundary
  // belongs to the next sector clockwise.
  const sectors: [CompassPoint, number, number][] = [
    ['n', 337.5, 22.5],
    ['ne', 22.5, 67.5],
    ['e', 67.5, 112.5],
    ['se', 112.5, 157.5],
    ['s', 157.5, 202.5],
    ['sw', 202.5, 247.5],
    ['w', 247.5, 292.5],
    ['nw', 292.5, 337.5],
  ];

  test.each(sectors)('%s covers [%d°, %d°)', (point, start, end) => {
    const centre = (start + 22.5) % 360;
    expect(compassPoint(centre)).toBe(point);
    expect(compassPoint(start)).toBe(point);
    expect(compassPoint(end - 0.01)).toBe(point);
    expect(compassPoint(end)).not.toBe(point);
  });

  test('wraps whole turns and negative angles', () => {
    expect(compassPoint(0)).toBe('n');
    expect(compassPoint(360)).toBe('n');
    expect(compassPoint(359.99)).toBe('n');
    expect(compassPoint(495)).toBe('se'); // 135°
    expect(compassPoint(-45)).toBe('nw');
  });
});

describe('windSentence', () => {
  test.each([
    [0, 'north'], [45, 'north-east'], [90, 'east'], [135, 'south-east'],
    [180, 'south'], [225, 'south-west'], [270, 'west'], [315, 'north-west'],
  ])('names the direction for %d°', (degrees, name) => {
    expect(windSentence(en, 5, degrees, 'kmh')).toBe(`Wind from the ${name} at 18 km/h.`);
  });

  // 5 m/s in each unit, rounded to whole units.
  test.each([
    ['kmh', '18 km/h', '18 kilometres per hour'],
    ['ms', '5 m/s', '5 metres per second'],
    ['knots', '10 kn', '10 knots'],
    ['mph', '11 mph', '11 miles per hour'],
  ] as const)('shows the speed in %s', (unit, shown, spoken) => {
    expect(windSentence(en, 5, 135, unit)).toBe(`Wind from the south-east at ${shown}.`);
    expect(windSentence(en, 5, 135, unit, { spoken: true })).toBe(`Wind from the south-east at ${spoken}.`);
  });

  test('covers every unit option', () => {
    for (const unit of WIND_UNITS) {
      expect(windSentence(en, 5, 135, unit)).toMatch(/^Wind from the south-east at \d+ \S+\.$/);
    }
  });

  test('uses the singular for 1 unit when spoken', () => {
    expect(windSentence(en, 1, 90, 'ms', { spoken: true })).toBe('Wind from the east at 1 metre per second.');
  });

  test.each(WIND_UNITS)('gives no direction at zero speed (%s)', unit => {
    expect(windSentence(en, 0, 135, unit)).toMatch(/^Wind speed 0 \S+\.$/);
  });

  test('treats a speed that rounds to 0 as zero', () => {
    expect(windSentence(en, 0.1, 135, 'kmh')).toBe('Wind speed 0 km/h.');
    expect(windSentence(en, 0.1, 135, 'kmh', { spoken: true })).toBe('Wind speed 0 kilometres per hour.');
  });

  test('leaves the direction out when it is missing', () => {
    expect(windSentence(en, 5, undefined, 'kmh')).toBe('Wind at 18 km/h.');
    expect(windSentence(en, 5, NaN, 'kmh')).toBe('Wind at 18 km/h.');
    expect(windSentence(en, 5, undefined, 'knots', { spoken: true })).toBe('Wind at 10 knots.');
  });

  test('zero speed wins over a missing direction', () => {
    expect(windSentence(en, 0, undefined, 'mph')).toBe('Wind speed 0 mph.');
  });

  test('has no descriptive words', () => {
    const sentences = [0, 2, 10, 20, 40].flatMap(speed => WIND_UNITS.map(unit => windSentence(en, speed, 135, unit)));
    for (const sentence of sentences) {
      expect(sentence).not.toMatch(/calm|breez|gentle|strong|gale|storm|light|moderate|safe|careful/i);
    }
  });

  test('works in Swahili', () => {
    expect(windSentence(sw, 5, 135, 'kmh')).toBe('Upepo kutoka kusini-mashariki kwa kasi ya 18 km/h.');
    expect(windSentence(sw, 5, 135, 'kmh', { spoken: true })).toBe('Upepo kutoka kusini-mashariki kwa kasi ya kilomita 18 kwa saa.');
    expect(windSentence(sw, 5, undefined, 'kmh')).toBe('Upepo kwa kasi ya 18 km/h.');
    expect(windSentence(sw, 0, 135, 'kmh')).toBe('Kasi ya upepo 0 km/h.');
  });
});
