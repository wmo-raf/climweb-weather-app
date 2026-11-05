import { DEFAULT_LANGUAGE as CONFIGURED_DEFAULT_LANGUAGE } from '@/config';
import { RAW_LANGUAGE_FILES, RawLanguageFile } from './language-files';
import { LanguageFile, Translations, schemaProblems } from './schema';

export type { LanguageFile, Translations } from './schema';

// App languages are discovered, not registered: every *.json file in this
// folder that follows the schema in schema.ts is a language, and everything
// else — which codes exist, the pickers, i18n resources, CAP feeds — is
// derived from those files. Country builds supply their own files here.
//
// Note: Swahili (swahili.json) is a machine-translated draft — every key is
// covered, but it hasn't been checked by a native speaker yet.

export type LanguageConfig = {
  label: string;
  name: string;
  nativeName: string;
  capFeedUrl: string;
  fallbackCapFeedUrl: string;
  capSenderId: string;
  capLanguageAliases: string[];
  resources: Translations;
};

export type LanguageKey = string;

/**
 * Keeps the files that follow the schema (one per language code) and orders
 * them for the pickers: English first, then by English name. Anything
 * skipped is reported in development.
 */
export function loadLanguageFiles(raw: RawLanguageFile[]): LanguageFile[] {
  const byCode = new Map<string, LanguageFile>();

  for (const { file, data } of raw) {
    const problems = schemaProblems(data);
    if (problems.length > 0) {
      if (__DEV__) console.warn(`Skipping language file ${file}: ${problems.join('; ')}`);
      continue;
    }
    const language = data as LanguageFile;
    if (byCode.has(language.code)) {
      if (__DEV__) console.warn(`Skipping language file ${file}: language "${language.code}" is already defined`);
      continue;
    }
    byCode.set(language.code, language);
  }

  return [...byCode.values()].sort((a, b) => {
    if (a.code === 'en') return -1;
    if (b.code === 'en') return 1;
    return a.name.localeCompare(b.name);
  });
}

export const LANGUAGE_FILES: LanguageFile[] = loadLanguageFiles(RAW_LANGUAGE_FILES);

export const LANGUAGES: Record<LanguageKey, LanguageConfig> = Object.fromEntries(
  LANGUAGE_FILES.map(file => [
    file.code,
    {
      label: file.native_name || file.name,
      name: file.name,
      nativeName: file.native_name,
      capFeedUrl: file.cap_feed_url,
      fallbackCapFeedUrl: file.fallback_cap_feed_url,
      capSenderId: file.cap_sender_id,
      capLanguageAliases: file.cap_language_aliases ?? [],
      resources: file.translations,
    },
  ])
);

/**
 * The language a fresh install starts in: EXPO_PUBLIC_DEFAULT_LANGUAGE when
 * it has a language file, else English, else the first language file.
 */
export function defaultLanguage(configured: string | undefined, languages: Record<string, unknown> = LANGUAGES): LanguageKey {
  const code = configured?.trim().toLowerCase();
  if (code && languages[code]) return code;
  if (code && __DEV__) console.warn(`EXPO_PUBLIC_DEFAULT_LANGUAGE "${configured}" has no language file; ignoring it.`);
  return languages.en ? 'en' : (Object.keys(languages)[0] ?? 'en');
}

export const DEFAULT_LANGUAGE: LanguageKey = defaultLanguage(CONFIGURED_DEFAULT_LANGUAGE);

// A stored or detected language that has no file (e.g. a language dropped
// from a country build) falls back to the default.
export function resolveLanguage(code: string | null | undefined): LanguageKey {
  return code && LANGUAGES[code] ? code : DEFAULT_LANGUAGE;
}
