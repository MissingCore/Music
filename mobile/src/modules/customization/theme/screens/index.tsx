// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import CreateTheme from "./CreateView";
import ModifyTheme from "./ModifyView";

import { Toolbar } from "~/components/next/composed/toolbar";

const ThemeScreenGroup = {
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
    CreateTheme,
    ModifyTheme,
  },
} as const;

export default ThemeScreenGroup;
