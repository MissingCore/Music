// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import CreateLyricProvider from "./CreateProviderView";
import ModifyLyricProvider from "./ModifyProviderView";
import LyricForm from "./LyricFormView";
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

    LyricForm: {
      screen: LyricForm,
      options: {
        presentation: "transparentModal",
        headerShown: false,
      },
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
