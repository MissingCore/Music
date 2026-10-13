// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import CreateLyricProvider from "./CreateProviderView";
import CreateLyric from "./CreateView";
import ModifyLyricProvider from "./ModifyProviderView";
import ModifyLyric from "./ModifyView";
import LyricsSettings from "./SettingsView";

import { Toolbar } from "~/components/next/composed/toolbar";

const LyricScreenGroup = {
  screenOptions: {
    animation: "fade",
  },
  screens: {
    LyricsSettings: {
      screen: LyricsSettings,
      layout: ({ children }: { children: React.JSX.Element }) => (
        <>
          <Toolbar.Default />
          {children}
        </>
      ),
      options: { headerShown: false },
    },

    CreateLyric: {
      screen: CreateLyric,
      options: { title: "form.create" },
    },
    ModifyLyric: {
      screen: ModifyLyric,
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
