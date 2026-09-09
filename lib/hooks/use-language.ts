import { useLanguageStore, SUPPORTED_LANGUAGES } from '@/lib/store/language-store';

export function useLanguage() {
  const languageCode = useLanguageStore((state) => state.languageCode);
  const setLanguageCode = useLanguageStore((state) => state.setLanguageCode);
  const currentLanguage = useLanguageStore((state) => state.getLanguage());

  return {
    languageCode,
    setLanguageCode,
    currentLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}
