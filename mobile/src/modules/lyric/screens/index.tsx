// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import LyricForm from "./LyricFormView";
import LyricProviderForm from "./LyricProviderFormView";
import LyricsSettings from "./SettingsView";

import { Toolbar } from "~/components/next/composed/toolbar";

const LyricScreenGroup = {
  screenLayout: ({ children }: { children: React.JSX.Element }) => (
    <>
      <Toolbar.Default />
      {children}
    </>
  ),
  screenOptions: {
    animation: "fade",
    headerShown: false,
  },
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
