import { RAW_LANGUAGE_FILES } from './language-files';
import { DEFAULT_LANGUAGE, LANGUAGES, defaultLanguage, loadLanguageFiles, resolveLanguage } from './index';
import { schemaProblems } from './schema';

// Every leaf key, as "a.b.c".
const keysOf = (obj: object, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return typeof v === 'string' ? [key] : keysOf(v, key);
  });

const english = RAW_LANGUAGE_FILES.find(f => f.file === './english.json')!.data as { translations: object };
const englishKeys = new Set(keysOf(english.translations));

// Keys a language file is known to be missing; they show in English until
// translated. Anything missing beyond these fails, so new gaps get noticed.
const KNOWN_GAPS: Record<string, string[]> = {
  './afaan_oromoo.json': [
    'Favourites', 'Go back', 'More', 'More conditions', 'more.favourites.description', 'more.intro', 'settings.rateApp',
    'units.celsius', 'units.fahrenheit', 'units.in', 'units.kmh', 'units.knots', 'units.mm', 'units.mph', 'units.ms',
    'units.precipitation', 'units.spoken.celsius', 'units.spoken.fahrenheit', 'units.temperature', 'units.title',
    'units.wind', 'welcome.title',
  ],
};

describe.each(RAW_LANGUAGE_FILES.map(f => [f.file, f.data] as const))('language file %s', (file, data) => {
  test('follows the schema', () => {
    expect(schemaProblems(data)).toEqual([]);
  });

  const keys = new Set(keysOf((data as { translations: object }).translations));

  test('has no keys that english.json lacks', () => {
    expect([...keys].filter(k => !englishKeys.has(k))).toEqual([]);
  });

  test('is missing no english.json keys beyond its known gaps', () => {
    const missing = [...englishKeys].filter(k => !keys.has(k)).sort();
    expect(missing).toEqual([...(KNOWN_GAPS[file] ?? [])].sort());
  });
});

describe('language discovery', () => {
  test('every file in the folder is a language, English first', () => {
    expect(Object.keys(LANGUAGES)).toEqual(['en', 'am', 'om', 'so', 'sw', 'ti']);
    expect(LANGUAGES.sw).toMatchObject({ name: 'Swahili', nativeName: 'Kiswahili', label: 'Kiswahili', capLanguageAliases: ['swa'] });
  });

  test('skips files that break the schema or repeat a code', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const valid = { code: 'xx', name: 'Test', native_name: 'Test', cap_feed_url: '', fallback_cap_feed_url: '', cap_sender_id: '', translations: { a: 'A', b: { c: 'C' } } };
    const loaded = loadLanguageFiles([
      { file: './a.json', data: valid },
      { file: './b.json', data: { ...valid, name: 'Duplicate' } },
      { file: './c.json', data: { ...valid, code: 'yy', translations: { a: 1 } } },
      { file: './d.json', data: { ...valid, code: 'zz', cap_feed_url: 'https://example.org/rss.xml' } }, // no sender
      { file: './e.json', data: [] },
      { file: './f.json', data: { ...valid, code: 'ww', cap_language_aliases: 'swa' } }, // not a list
      { file: './g.json', data: { ...valid, code: 'vv', cap_language_aliases: ['swa', 'sw-TZ'] } },
    ]);
    expect(loaded.map(l => [l.code, l.name])).toEqual([['xx', 'Test'], ['vv', 'Test']]);
    expect(warn).toHaveBeenCalledTimes(5);
    warn.mockRestore();
  });
});

describe('default language', () => {
  const languages = { en: {}, sw: {}, am: {} };

  test('uses EXPO_PUBLIC_DEFAULT_LANGUAGE when it has a language file', () => {
    expect(defaultLanguage('sw', languages)).toBe('sw');
    expect(defaultLanguage(' SW ', languages)).toBe('sw');
  });

  test('is English when unset or without a file', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(defaultLanguage(undefined, languages)).toBe('en');
    expect(defaultLanguage('fr', languages)).toBe('en');
    warn.mockRestore();
  });

  test('is the first language when there is no English file', () => {
    expect(defaultLanguage(undefined, { sw: {}, am: {} })).toBe('sw');
  });

  test('a saved language without a file falls back to the default', () => {
    expect(resolveLanguage('sw')).toBe('sw');
    expect(resolveLanguage('fr')).toBe(DEFAULT_LANGUAGE);
    expect(resolveLanguage(undefined)).toBe(DEFAULT_LANGUAGE);
  });
});
