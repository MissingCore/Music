// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import { resources } from "./translations/resources";

i18next.use(initReactI18next).init({
  lng: "en",
  fallbackLng: () => ({
    pt: ["pt-BR", "en"],
    zh: ["zh-Hans", "en"],
    default: ["en"],
  }),
  resources,

  //? Disable namespaces as we store all translations in a single file.
  //? By default, in `namespace:translation.key`, `t()` will look for
  //? `translation.key` in a `namespace.json` file.
  //?
  //? This in turns breaks the `TranslationKeyOrString` type if the string
  //? has a colon in it.
  //?   - https://github.com/MissingCore/Music/issues/648
  nsSeparator: false,
});

export default i18next;
