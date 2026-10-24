// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import CreateTheme from "./CreateView";
import ModifyTheme from "./ModifyView";

const ThemeScreenGroup = {
  screenOptions: { animation: "fade" },
  screens: {
    CreateTheme,
    ModifyTheme,
  },
} as const;

export default ThemeScreenGroup;
