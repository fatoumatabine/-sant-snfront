import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import translationFR from './locales/fr.json';
import translationEN from './locales/en.json';
import translationWO from './locales/wo.json';

const resources = {
  fr: {
    translation: translationFR
  },
  en: {
    translation: translationEN
  },
  wo: {
    translation: translationWO
  }
};

const getStoredLanguage = (): string => {
  try {
    return localStorage.getItem('language') || 'fr';
  } catch {
    return 'fr';
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    lng: getStoredLanguage(),
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
