import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enLayout from "./locales/en/layout.json";
import enReader from "./locales/en/reader.json";
import enSettings from "./locales/en/settings.json";
import zhCommon from "./locales/zh-CN/common.json";
import zhLayout from "./locales/zh-CN/layout.json";
import zhReader from "./locales/zh-CN/reader.json";
import zhSettings from "./locales/zh-CN/settings.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
      convertDetectedLanguage: (lng: string) => {
        if (lng.startsWith("zh")) return "zh-CN";
        return "en";
      },
    },
    resources: {
      en: {
        common: enCommon,
        layout: enLayout,
        reader: enReader,
        settings: enSettings,
      },
      "zh-CN": {
        common: zhCommon,
        layout: zhLayout,
        reader: zhReader,
        settings: zhSettings,
      },
    },
    ns: ["common", "layout", "reader", "settings"],
    defaultNS: "common",
  });

export default i18n;
