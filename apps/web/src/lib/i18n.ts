import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import common from '../locales/tr/common.json';
import auth from '../locales/tr/auth.json';
import admin from '../locales/tr/admin.json';
import properties from '../locales/tr/properties.json';
import team from '../locales/tr/team.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      tr: { common, auth, admin, properties, team },
    },
    lng: 'tr',
    fallbackLng: 'tr',
    defaultNS: 'common',
    ns: ['common', 'auth', 'admin', 'properties', 'team'],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
