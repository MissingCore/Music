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
