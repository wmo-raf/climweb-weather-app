import { soilMoistureWords, soilTemperatureWords } from './plain-language';

const MOISTURE = {
  dryBelow: 0.15,
  tooWetFrom: 0.35,
  scaleMax: 0.5,
  keys: {
    dry: { zone: 'z.dry', headline: 'h.dry', advice: 'a.dry' },
    good: { zone: 'z.good', headline: 'h.good', advice: 'a.good' },
    tooWet: { zone: 'z.tooWet', headline: 'h.tooWet', advice: 'a.tooWet' },
  },
};

const TEMPERATURE = {
  coldBelow: 12,
  coolBelow: 20,
  hotFrom: 40,
  keys: {
    cold: { words: 'w.cold', advice: 'a.cold' },
    cool: { words: 'w.cool', advice: 'a.cool' },
    warm: { words: 'w.warm', advice: 'a.warm' },
    hot: { words: 'w.hot', advice: 'a.hot' },
  },
};

describe('soilMoistureWords', () => {
  test.each([
    [0, 'dry'], [0.149, 'dry'], [0.15, 'good'], [0.25, 'good'], [0.349, 'good'], [0.35, 'tooWet'], [0.6, 'tooWet'],
  ])('%p m³/m³ is %p', (value, band) => {
    expect(soilMoistureWords(value, MOISTURE).band).toBe(band);
  });

  test('headline, advice and zone all come from the same band', () => {
    expect(soilMoistureWords(0.25, MOISTURE)).toMatchObject({ zone: 'z.good', headline: 'h.good', advice: 'a.good' });
    expect(soilMoistureWords(0.05, MOISTURE)).toMatchObject({ zone: 'z.dry', headline: 'h.dry', advice: 'a.dry' });
  });

  test('positions the value and the zone edges on the bar', () => {
    const words = soilMoistureWords(0.25, MOISTURE);
    expect(words.position).toBeCloseTo(0.5);
    expect(words.zoneStarts.good).toBeCloseTo(0.3);
    expect(words.zoneStarts.tooWet).toBeCloseTo(0.7);
  });

  test('keeps the fill on the bar for out-of-range values', () => {
    expect(soilMoistureWords(0.9, MOISTURE).position).toBe(1);
    expect(soilMoistureWords(-0.1, MOISTURE).position).toBe(0);
  });

  test('uses the config defaults, whose keys all exist in English and Swahili', () => {
    const en = require('@/lib/localization/translations/english.json').translations;
    const sw = require('@/lib/localization/translations/swahili.json').translations;
    const lookup = (dict: any, key: string) => key.split('.').reduce((o, k) => o?.[k], dict);
    for (const value of [0.05, 0.25, 0.45]) {
      const words = soilMoistureWords(value);
      for (const key of [words.zone, words.headline, words.advice]) {
        expect(typeof lookup(en, key)).toBe('string');
        expect(typeof lookup(sw, key)).toBe('string');
      }
    }
    expect(lookup(en, soilMoistureWords(0.25).headline)).toBe('Enough to plant');
  });
});

describe('soilTemperatureWords', () => {
  test.each([
    [5, 'cold'], [11.9, 'cold'], [12, 'cool'], [19.9, 'cool'], [20, 'warm'], [24, 'warm'], [39.9, 'warm'], [40, 'hot'],
  ])('%p °C is %p', (celsius, band) => {
    expect(soilTemperatureWords(celsius, TEMPERATURE).band).toBe(band);
  });

  test('gives the words and advice keys for the band', () => {
    expect(soilTemperatureWords(24, TEMPERATURE)).toEqual({ band: 'warm', words: 'w.warm', advice: 'a.warm' });
  });

  test('default wording reads "warm enough" / "Seeds will sprout well."', () => {
    const en = require('@/lib/localization/translations/english.json').translations;
    const words = soilTemperatureWords(24);
    expect(words.words.split('.').reduce((o: any, k: string) => o?.[k], en)).toBe('warm enough');
    expect(words.advice.split('.').reduce((o: any, k: string) => o?.[k], en)).toBe('Seeds will sprout well.');
  });
});
