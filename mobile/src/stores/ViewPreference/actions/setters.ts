// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { viewPreferenceStore } from "../store";
import type { LayoutOption, ScreenSortOptions } from "../constants";
import type { MutableViewLayout, MutableViewOrder } from "../types";

export function setLayout(screen: MutableViewLayout, layout: LayoutOption) {
  viewPreferenceStore.setState({ [`${screen}Layout`]: layout });
}

export function setSortOrder<TScreen extends MutableViewOrder>(
  screen: TScreen,
  sortOrder: ScreenSortOptions<TScreen>,
) {
  viewPreferenceStore.setState({ [`${screen}Order`]: sortOrder });
}
