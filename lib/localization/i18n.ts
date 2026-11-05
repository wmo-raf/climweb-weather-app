import i18n, { LanguageDetectorModule } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { storage } from '@/lib/storage';
import { DEFAULT_LANGUAGE, LANGUAGES, resolveLanguage } from './translations';

const STORE_LANGUAGE_KEY = 'settings.lang';

// MMKV reads are synchronous, so detection no longer needs the
// callback-based async detector interface.
const languageDetectorPlugin: LanguageDetectorModule = {
    type: 'languageDetector',
    // The user's saved choice, else the default (EXPO_PUBLIC_DEFAULT_LANGUAGE,
    // see translations/index.ts). A saved language whose file is no longer
    // present falls back to the default too.
    detect: () => resolveLanguage(storage.getString(STORE_LANGUAGE_KEY)),
    cacheUserLanguage: (language: string) => {
        storage.set(STORE_LANGUAGE_KEY, language);
    },
};

// Resources for every discovered language file (see translations/index.ts)
const resources: { [key: string]: { translation: any } } = {};
Object.entries(LANGUAGES).forEach(([key, { resources: res }]) => {
  resources[key] = { translation: res };
});

i18n.use(initReactI18next).use(languageDetectorPlugin).init({
    resources,
    compatibilityJSON: 'v4',
    // Missing keys fall back to English, the complete reference file, even
    // when the default language is another one.
    fallbackLng: LANGUAGES.en ? 'en' : DEFAULT_LANGUAGE,
    interpolation: {
        escapeValue: false,
    },
});
export default i18n;
