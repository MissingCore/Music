import type {
  BottomSheetBackdropProps,
  BottomSheetProps,
} from "@gorhom/bottom-sheet";
import _BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useSetAtom } from "jotai";
import { cssInterop } from "nativewind";
import { useCallback, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { modalConfigAtom } from "../store";

const BottomSheet = cssInterop(_BottomSheet, {
  className: "style",
  backgroundClassName: "backgroundStyle",
  handleClassName: "handleStyle",
  handleIndicatorClassName: "handleIndicatorStyle",
});

/** @description Our default implementation of `<BottomSheet />`. */
export function ModalBase({
  children,
  snapPoints,
  ...props
}: Omit<BottomSheetProps, "ref">) {
  const insets = useSafeAreaInsets();
  const setModalConfig = useSetAtom(modalConfigAtom);

  const modalSnapPoints = useMemo(
    () => snapPoints ?? ["60%", "100%"],
    [snapPoints],
  );

  const handleSheetChanges = useCallback(
    (index: number) => {
      // Closing the modal will reset the `modalConfig` atom for reuse.
      if (index === -1) setModalConfig(null);
    },
    [setModalConfig],
  );

  return (
    <BottomSheet
      snapPoints={modalSnapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      topInset={insets.top}
      backdropComponent={Backdrop}
      backgroundClassName="bg-surface800"
      handleIndicatorClassName="bg-surface500"
      {...props}
    >
      {children}
    </BottomSheet>
  );
}

/** @description Our version of `<BottomSheetBackdrop />`. */
function Backdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
  );
}
