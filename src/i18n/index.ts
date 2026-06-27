import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";

const savedLang = typeof window !== "undefined"
  ? localStorage.getItem("medseva_lang") ?? "en"
  : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: savedLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export const setLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  if (typeof window !== "undefined") {
    localStorage.setItem("medseva_lang", lang);
  }
};

export default i18n;
