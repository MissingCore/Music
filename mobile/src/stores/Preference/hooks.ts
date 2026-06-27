// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";

import { usePreferenceStore } from "./store";

export function useTabsByVisibility() {
  const tabsOrder = usePreferenceStore((s) => s.tabsOrder);
  const tabsVisibility = usePreferenceStore((s) => s.tabsVisibility);

  return useMemo(
    () => ({
      displayedTabs: tabsOrder.filter((tabName) => tabsVisibility[tabName]),
      hiddenTabs: tabsOrder.filter((tabName) => !tabsVisibility[tabName]),
    }),
    [tabsOrder, tabsVisibility],
  );
}
