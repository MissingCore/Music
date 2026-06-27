// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { preferenceStore } from "../store";
import type { Tab } from "../types";

import { moveArray } from "~/utils/object";

export function move(fromIndex: number, toIndex: number) {
  preferenceStore.setState(({ tabsOrder }) => ({
    tabsOrder: moveArray(tabsOrder, { fromIndex, toIndex }),
  }));
}

export function setHome(tab: Tab) {
  preferenceStore.setState({ homeTab: tab });
}

export function toggleVisibility(tab: Tab) {
  preferenceStore.setState(({ tabsVisibility }) => ({
    tabsVisibility: { ...tabsVisibility, [tab]: !tabsVisibility[tab] },
  }));
}
