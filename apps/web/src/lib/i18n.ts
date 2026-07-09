import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import trCommon from '../locales/tr/common.json';
import trAuth from '../locales/tr/auth.json';
import trAdmin from '../locales/tr/admin.json';
import trProperties from '../locales/tr/properties.json';
import trTeam from '../locales/tr/team.json';
import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enAdmin from '../locales/en/admin.json';
import enProperties from '../locales/en/properties.json';
import enTeam from '../locales/en/team.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      tr: {
        common: trCommon,
        auth: trAuth,
        admin: trAdmin,
        properties: trProperties,
        team: trTeam,
      },
      en: {
        common: enCommon,
        auth: enAuth,
        admin: enAdmin,
        properties: enProperties,
        team: enTeam,
      },
    },
    fallbackLng: 'tr',
    supportedLngs: ['tr', 'en'],
    defaultNS: 'common',
    ns: ['common', 'auth', 'admin', 'properties', 'team'],
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language',
    },
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
