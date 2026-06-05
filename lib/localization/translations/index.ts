import enResources from './english.json';

export const LANGUAGES = {
  en: {
    label: 'English',
    resources: enResources,
  },
};

export type LanguageKey = keyof typeof LANGUAGES;