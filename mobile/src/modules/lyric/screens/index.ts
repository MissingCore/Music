// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import CreateLyricProvider from "./CreateProviderView";
import LyricForm from "./LyricFormView";
import ModifyLyricProvider from "./ModifyProviderView";
import LyricsSettings from "./SettingsView";

const LyricScreenGroup = {
  screenOptions: {
    animation: "fade",
  },
  screens: {
    LyricsSettings: {
      screen: LyricsSettings,
      options: { title: "feat.lyrics.title" },
    },

    LyricForm: {
      screen: LyricForm,
      options: { title: "form.edit" },
    },

    CreateLyricProvider: {
      screen: CreateLyricProvider,
      options: { title: "form.create" },
    },
    ModifyLyricProvider: {
      screen: ModifyLyricProvider,
      options: { title: "form.edit" },
    },
  },
} as const;

export default LyricScreenGroup;
