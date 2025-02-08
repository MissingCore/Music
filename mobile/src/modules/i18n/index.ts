import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import ca from "./translations/ca.json";
import de from "./translations/de.json";
import en from "./translations/en.json";
import es from "./translations/es.json";
import fr from "./translations/fr.json";
import id from "./translations/id.json";
import ja from "./translations/ja.json";
import ru from "./translations/ru.json";
import tr from "./translations/tr.json";
import zhHans from "./translations/zh-Hans.json";

const resources = {
  ca: { translation: ca },
  de: { translation: de },
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  id: { translation: id },
  ja: { translation: ja },
  ru: { translation: ru },
  tr: { translation: tr },
  "zh-Hans": { translation: zhHans },
};

i18next.use(initReactI18next).init({
  lng: "en",
  fallbackLng: () => ({
    zh: ["zh-Hans", "en"],
    default: ["en"],
  }),
  resources,
});

export default i18next;
