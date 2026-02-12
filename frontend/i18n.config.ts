// i18n.config.ts - i18next configuration for multi-language support

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from './public/locales/en/translation.json';
import hiTranslation from './public/locales/hi/translation.json';
import mrTranslation from './public/locales/mr/translation.json';
import taTranslation from './public/locales/ta/translation.json';
import teTranslation from './public/locales/te/translation.json';

const resources = {
  en: { translation: enTranslation },
  hi: { translation: hiTranslation },
  mr: { translation: mrTranslation },
  ta: { translation: taTranslation },
  te: { translation: teTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
