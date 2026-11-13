// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import LyricForm from "./LyricFormView";
import LyricProviderForm from "./LyricProviderFormView";
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

    LyricForm,
    LyricProviderForm,
  },
} as const;

export default LyricScreenGroup;
