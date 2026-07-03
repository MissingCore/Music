// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

type LanguageItem = {
  code: string;
  name: string;
  rtl?: true;
  translators: Array<{ display: string; link: string }>;
};

/** List of available languages that our app supports. */
export const LANGUAGES = [
  {
    code: "ar",
    name: "العربية",
    rtl: true,
    translators: [
      { display: "Tariq Said", link: "https://github.com/tariqsaidofficial" },
    ],
  },
  {
    code: "ca",
    name: "Català",
    translators: [
      { display: "JPQ", link: "https://www.github.com/T-K-Y-M" },
      { display: "Miquel Roca", link: "https://github.com/MiquelRoca08" },
      {
        display: "Jaume Valero",
        link: "https://crowdin.com/profile/jaumevalerom13",
      },
    ],
  },
  {
    code: "da",
    name: "Dansk",
    translators: [
      { display: "friiskoch", link: "https://github.com/friiskoch" },
    ],
  },
  {
    code: "de",
    name: "Deutsch",
    translators: [
      { display: "Ladle", link: "https://www.github.com/The-Ladle" },
      { display: "friiskoch", link: "https://github.com/friiskoch" },
      { display: "Costeer", link: "https://github.com/Costeer" },
      {
        display: "Jakob Staiger",
        link: "https://crowdin.com/profile/staigerm62",
      },
    ],
  },
  {
    code: "en",
    name: "English",
    translators: [{ display: "—", link: "https://github.com/cyanChill" }],
  },
  {
    code: "es",
    name: "Español",
    translators: [
      { display: "G4b-0", link: "https://www.github.com/G4b-0" },
      { display: "JPQ", link: "https://www.github.com/T-K-Y-M" },
    ],
  },
  {
    code: "fa",
    name: "فارسی",
    rtl: true,
    translators: [
      { display: "Sourosh Tahvilian", link: "https://github.com/soorosh-st" },
    ],
  },
  {
    code: "fr",
    name: "Français",
    translators: [
      { display: "Nino", link: "https://www.github.com/nin7o" },
      {
        display: "Julian Bouys",
        link: "https://crowdin.com/profile/julian.bouys",
      },
      { display: "Mickael81", link: "https://crowdin.com/profile/mickael81" },
      { display: "Sertra", link: "https://www.github.com/SertraFurr" },
    ],
  },
  {
    code: "hi",
    name: "हिंदी",
    translators: [
      { display: "Sourabh Mishra", link: "https://www.github.com/OxSourabh" },
      { display: "Earendel", link: "https://github.com/Earendel-lab" },
    ],
  },
  {
    code: "id",
    name: "Indonesia",
    translators: [
      {
        display: "Lieba Natur Brilian",
        link: "https://www.github.com/naturbrilian",
      },
    ],
  },
  {
    code: "it",
    name: "Italiano",
    translators: [{ display: "R1D3R175", link: "https://github.com/R1D3R175" }],
  },
  {
    code: "ja",
    name: "日本語",
    translators: [
      {
        display: "Re*Index. (ot_inc)",
        link: "https://www.github.com/reindex-ot",
      },
    ],
  },
  {
    code: "pl",
    name: "Polski",
    translators: [
      { display: "Krystian Piątek", link: "https://www.github.com/p-krystian" },
    ],
  },
  {
    code: "ru",
    name: "Русский",
    translators: [
      { display: "klinoff0", link: "https://www.github.com/klinoff0" },
      {
        display: "Nonameguy48",
        link: "https://crowdin.com/profile/thenonameguy295",
      },
      {
        display: "Artem Yakovlev",
        link: "https://crowdin.com/profile/socutezyy",
      },
      { display: "Да Угу", link: "https://crowdin.com/profile/tytocka" },
      { display: "fraffrog", link: "https://crowdin.com/profile/zfraaaaa" },
      { display: "Julia", link: "https://crowdin.com/profile/julia5656try" },
      { display: "Smashik", link: "https://crowdin.com/profile/smashik" },
    ],
  },
  {
    code: "tr",
    name: "Türkçe",
    translators: [
      { display: "𝗛𝗼𝗹𝗶", link: "https://www.github.com/mikropsoft" },
    ],
  },
  {
    code: "zh-Hans",
    name: "简体中文",
    translators: [
      { display: "yang1206", link: "https://www.github.com/yang1206" },
    ],
  },
] satisfies LanguageItem[];
