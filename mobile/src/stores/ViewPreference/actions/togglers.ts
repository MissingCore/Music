import { viewPreferenceStore } from "../store";
import type { MutableOrder } from "../types";

export function toggleIsAsc(screen: MutableOrder) {
  const key = `${screen}IsAsc` as const;
  viewPreferenceStore.setState((prev) => ({ [key]: !prev[key] }));
}
