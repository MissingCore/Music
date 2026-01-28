import { viewPreferenceStore } from "../store";
import type { LayoutOption } from "../constants";
import type { MutableLayout } from "../types";

export function setLayout(screen: MutableLayout, layout: LayoutOption) {
  viewPreferenceStore.setState({ [`${screen}Layout`]: layout });
}
