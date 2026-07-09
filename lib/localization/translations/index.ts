import enResources from './english.json';
import swResources from './swahili.json';

export const LANGUAGES = {
  en: {
    label: 'English',
    resources: enResources,
  },
  // Machine-translated draft (see Step 6 of the Zanyengo redesign) — every
  // key from english.json is covered, but the wording has not been checked
  // by a native Swahili speaker yet. Treat as a starting point, not final copy.
  sw: {
    label: 'Kiswahili',
    resources: swResources,
  },
};

export type LanguageKey = keyof typeof LANGUAGES;
