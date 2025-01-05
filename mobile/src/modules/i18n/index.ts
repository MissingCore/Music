import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import de from "./translations/de.json";
import en from "./translations/en.json";
import es from "./translations/es.json";
import id from "./translations/id.json";
import ja from "./translations/ja.json";
import zhHans from "./translations/zh-Hans.json";

const resources = {
  de: { translation: de },
  en: { translation: en },
  es: { translation: es },
  id: { translation: id },
  ja: { translation: ja },
  'zh-Hans': { translation: zhHans },
};

i18next.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  resources,
});

export default i18next;
