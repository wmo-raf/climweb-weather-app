import { useLanguageStore, SUPPORTED_LANGUAGES } from '@/lib/store/language-store';
import { useTranslation } from 'react-i18next';

export function useLanguage() {
  const { i18n } = useTranslation();
  const languageCode = useLanguageStore((state) => state.languageCode);
  const setLanguageCodeStore = useLanguageStore((state) => state.setLanguageCode);
  const currentLanguage = useLanguageStore((state) => state.getLanguage());

  const setLanguageCode = (code: string) => {
    setLanguageCodeStore(code);
    i18n.changeLanguage(code);
  };

  return {
    languageCode,
    setLanguageCode,
    currentLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}
