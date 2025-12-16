import type { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useRef } from "react";

export type TrueSheetRef = React.Ref<TrueSheet>;

export function useSheetRef() {
  return useRef<TrueSheet>(null);
}
