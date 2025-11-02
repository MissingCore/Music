import { userPreferenceStore } from "../store";
import type { Tab } from "../types";

import { moveArray } from "~/utils/object";

export function move(fromIndex: number, toIndex: number) {
  userPreferenceStore.setState(({ tabsOrder }) => ({
    tabsOrder: moveArray(tabsOrder, { fromIndex, toIndex }),
  }));
}

export function setHome(tab: Tab) {
  userPreferenceStore.setState({ homeTab: tab });
}

export function toggleVisibility(tab: Tab) {
  userPreferenceStore.setState(({ tabsVisibility }) => ({
    tabsVisibility: { ...tabsVisibility, [tab]: !tabsVisibility[tab] },
  }));
}
