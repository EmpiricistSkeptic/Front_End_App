// src/i18n/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// импортируем словари
import en from './locales/en.json';
import es from './locales/es.json';

const LANG_KEY = 'app_language_v6';

// кастомный language detector для RN
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const storedLang = await AsyncStorage.getItem(LANG_KEY);
      if (storedLang) {
        return callback(storedLang);
      }

      const locales = Localization.getLocales(); // expo-localization :contentReference[oaicite:3]{index=3}
      const deviceLang = locales?.[0]?.languageCode || 'en';
      callback(deviceLang);
    } catch (e) {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng) => {
    try {
      await AsyncStorage.setItem(LANG_KEY, lng);
    } catch {}
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // безопасно для RN
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // RN сам экранирует
    },
    react: {
      useSuspense: false, // чтобы не ловить подвисания на старте
    },
  });

export default i18n;
export { LANG_KEY };
