import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import all locales
import en from "./locales/en.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";
import zh from "./locales/zh.json";
import fr from "./locales/fr.json";

export const SUPPORTED_LANGUAGES = [
  { code: "es", name: "Español" },
  { code: "en", name: "English" },
  { code: "pt", name: "Português" },
  { code: "zh", name: "中文" },
  { code: "fr", name: "Français" },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      pt: { translation: pt },
      zh: { translation: zh },
      fr: { translation: fr },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "es", "pt", "zh", "fr"],
    load: "languageOnly",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    debug: process.env.NODE_ENV === "development",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
