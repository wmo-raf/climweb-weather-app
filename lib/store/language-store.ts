import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { jsonStorage } from '@/lib/storage';

const LANGUAGE_KEY = 'language-storage';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo' },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaaliga' },
];

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
