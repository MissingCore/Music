import { viewPreferenceStore } from "../store";
import type { MutableViewOrder } from "../types";

export function toggleIsAsc(screen: MutableViewOrder) {
  const key = `${screen}IsAsc` as const;
  viewPreferenceStore.setState((prev) => ({ [key]: !prev[key] }));
}
