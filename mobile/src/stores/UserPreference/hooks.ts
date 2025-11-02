import { useMemo } from "react";

import { useUserPreferenceStore } from "./store";

export function useTabsByVisibility() {
  const tabsOrder = useUserPreferenceStore((s) => s.tabsOrder);
  const tabsVisibility = useUserPreferenceStore((s) => s.tabsVisibility);

  return useMemo(
    () => ({
      displayedTabs: tabsOrder.filter((tabName) => tabsVisibility[tabName]),
      hiddenTabs: tabsOrder.filter((tabName) => !tabsVisibility[tabName]),
    }),
    [tabsOrder, tabsVisibility],
  );
}
