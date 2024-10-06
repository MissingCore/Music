import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef } from "react";

/** Simple hook to get a ref for a `<ModalSheet />`. */
export function useModalRef() {
  const ref = useRef<BottomSheetModal>(null);
  return ref;
}
