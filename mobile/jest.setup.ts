// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

jest.mock("@missingcore/native-utils", () => ({
  isSystemDarkMode: true,
}));

//? https://www.i18next.com/react/misc/testing
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: () => new Promise(() => {}) },
  }),
  // so the i18n.js file of your app can still call .use(initReactI18next)
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

jest.mock("react-native-material-palette", () => ({
  createPalette: jest.fn(),
}));
