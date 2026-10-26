// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import LyricForm from "./LyricFormView";
import LyricProviderForm from "./LyricProviderFormView";
import LyricsSettings from "./SettingsView";

const LyricScreenGroup = {
  screenOptions: { animation: "fade" },
  screens: {
    LyricsSettings,

    LyricForm: {
      screen: LyricForm,
      layout: ({ children }: { children: React.JSX.Element }) => children,
      options: {
        presentation: "transparentModal",
      },
    },
    LyricProviderForm,
  },
} as const;

export default LyricScreenGroup;
