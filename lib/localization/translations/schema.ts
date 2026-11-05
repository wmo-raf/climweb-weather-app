// The language file format. Every *.json file in this folder that matches
// it is picked up as an app language (see index.ts):
//
//   {
//     "code": "sw",                    // app language code (i18next key)
//     "name": "Swahili",               // English name
//     "native_name": "Kiswahili",      // shown in the language pickers
//     "cap_feed_url": "",              // CAP alerts RSS feed for this language
//     "fallback_cap_feed_url": "",     // used when cap_feed_url is down; optional
//     "cap_sender_id": "",             // <sender> whose messages are shown; required with a feed
//     "cap_language_aliases": ["swa"], // other CAP <language> codes meaning this language; optional
//     "translations": { "settings": { "title": "Mipangilio" }, ... }
//   }
//
// Feed URLs may repeat across languages (e.g. one feed carrying several
// languages). A language with no cap_feed_url uses the default language's
// feed, fallback and sender (see lib/alerts/providers/cap-alerts/rss.ts).
export type Translations = { [key: string]: string | Translations };

export type LanguageFile = {
  code: string;
  name: string;
  native_name: string;
  cap_feed_url: string;
  fallback_cap_feed_url: string;
  cap_sender_id: string;
  // Other codes CAP feeds use in <language> for this language, besides
  // `code` and its regional variants (e.g. the 3-letter "swa"). Optional.
  cap_language_aliases?: string[];
  translations: Translations;
};

const isString = (value: unknown): value is string => typeof value === 'string';
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isFeedUrl = (value: unknown) => isString(value) && (value === '' || /^https?:\/\/\S+$/.test(value));

// Translations nest (as in english.json) down to string values.
const isTranslations = (value: unknown): boolean =>
  isObject(value) && Object.values(value).every(v => isString(v) || isTranslations(v));

// Everything wrong with a candidate language file; empty means it's valid.
export function schemaProblems(data: unknown): string[] {
  if (!isObject(data)) return ['not a JSON object'];
  const problems: string[] = [];

  if (!isString(data.code) || !/^[a-z]{2,3}$/.test(data.code)) {
    problems.push('"code" must be a 2–3 letter lowercase language code');
  }
  if (!isString(data.name) || data.name.trim() === '') problems.push('"name" is required');
  if (!isString(data.native_name) || data.native_name.trim() === '') problems.push('"native_name" is required');
  if (!isFeedUrl(data.cap_feed_url)) problems.push('"cap_feed_url" must be empty or an http(s) URL');
  if (!isFeedUrl(data.fallback_cap_feed_url)) problems.push('"fallback_cap_feed_url" must be empty or an http(s) URL');
  if (!isString(data.cap_sender_id)) problems.push('"cap_sender_id" must be text');
  if (isString(data.cap_feed_url) && data.cap_feed_url !== '' && isString(data.cap_sender_id) && data.cap_sender_id.trim() === '') {
    problems.push('"cap_sender_id" is required when "cap_feed_url" is set (otherwise every warning is hidden)');
  }
  if (isString(data.fallback_cap_feed_url) && data.fallback_cap_feed_url !== '' && data.cap_feed_url === '') {
    problems.push('"fallback_cap_feed_url" needs a "cap_feed_url" too');
  }
  if (data.cap_language_aliases !== undefined && !(
    Array.isArray(data.cap_language_aliases) &&
    data.cap_language_aliases.every(a => isString(a) && /^[A-Za-z]{2,8}([-_][A-Za-z0-9]{1,8})*$/.test(a))
  )) {
    problems.push('"cap_language_aliases" must be a list of language codes, e.g. ["swa"]');
  }
  if (!isTranslations(data.translations)) {
    problems.push('"translations" must be an object whose values are text or nested objects of text');
  }
  return problems;
}
