import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import { resources } from "./translations/resources";

i18next.use(initReactI18next).init({
  lng: "en",
  fallbackLng: () => ({
    zh: ["zh-Hans", "en"],
    default: ["en"],
  }),
  resources,
});

export default i18next;
