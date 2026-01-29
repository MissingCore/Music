import { viewPreferenceStore } from "../store";
import type { LayoutOption, ScreenSortOptions } from "../constants";
import type { MutableLayout, MutableOrder } from "../types";

export function setLayout(screen: MutableLayout, layout: LayoutOption) {
  viewPreferenceStore.setState({ [`${screen}Layout`]: layout });
}

export function setSortOrder<TScreen extends MutableOrder>(
  screen: TScreen,
  sortOrder: ScreenSortOptions<TScreen>,
) {
  viewPreferenceStore.setState({ [`${screen}Order`]: sortOrder });
}
