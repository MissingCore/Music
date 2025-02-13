import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import ca from "./translations/_legacy/ca.json";
import de from "./translations/_legacy/de.json";
import en from "./translations/_legacy/en.json";
import es from "./translations/_legacy/es.json";
import fr from "./translations/_legacy/fr.json";
import hi from "./translations/_legacy/hi.json";
import id from "./translations/_legacy/id.json";
import ja from "./translations/_legacy/ja.json";
import ru from "./translations/_legacy/ru.json";
import tr from "./translations/_legacy/tr.json";
import zhHans from "./translations/_legacy/zh-Hans.json";

const resources = {
  ca: { translation: ca },
  de: { translation: de },
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  hi: { translation: hi },
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
