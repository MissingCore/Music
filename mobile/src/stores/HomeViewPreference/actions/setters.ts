import { homeViewPreferenceStore } from "../store";
import type { LayoutOption } from "../constants";
import type { MutableLayout } from "../types";

export function setLayout(screen: MutableLayout, layout: LayoutOption) {
  homeViewPreferenceStore.setState({ [`${screen}Layout`]: layout });
}
