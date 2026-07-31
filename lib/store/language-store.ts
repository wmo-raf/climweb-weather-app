import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { jsonStorage } from '@/lib/storage';
import { LANGUAGES } from '@/lib/localization/translations';

const LANGUAGE_KEY = 'language-storage';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: Language[] = Object.entries(LANGUAGES).map(
  ([code, config]) => ({
    code,
    name: config.name,
    nativeName: config.nativeName,
  })
);

interface LanguageState {
  languageCode: string;
  setLanguageCode: (code: string) => void;
  getLanguage: () => Language;
}

const getInitialLanguageCode = (): string => {
  try {
    const raw = jsonStorage.getItem(LANGUAGE_KEY);
    if (typeof raw === 'string') {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.state && typeof parsed.state.languageCode === 'string') {
        return parsed.state.languageCode;
      }
    }
  } catch {
    // ignore
  }
  return 'en';
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      languageCode: getInitialLanguageCode(),
      setLanguageCode: (languageCode) => set({ languageCode }),
      getLanguage: () => {
        const code = get().languageCode;
        return SUPPORTED_LANGUAGES.find((lang) => lang.code === code) || SUPPORTED_LANGUAGES[0];
      },
    }),
    {
      name: LANGUAGE_KEY,
      storage: createJSONStorage(() => jsonStorage),
    }
  )
);
