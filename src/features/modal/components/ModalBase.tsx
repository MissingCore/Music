import type {
  BottomSheetBackdropProps,
  BottomSheetBackgroundProps,
  BottomSheetProps,
} from "@gorhom/bottom-sheet";
import _BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useSetAtom } from "jotai";
import { cssInterop } from "nativewind";
import { useCallback, useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { modalAtom } from "../store";

const BottomSheet = cssInterop(_BottomSheet, {
  className: "style",
  backgroundClassName: "backgroundStyle",
  handleClassName: "handleStyle",
  handleIndicatorClassName: "handleIndicatorStyle",
});

/**
 * @description Implementation of bottom sheet w/ 2 different designs,
 *  selected by the value of the `detached` prop.
 */
export function ModalBase({
  detached,
  children,
  ...props
}: Omit<BottomSheetProps, "ref">) {
  const insets = useSafeAreaInsets();
  const closeModal = useSetAtom(modalAtom);

  const modalSnapPoints = useMemo(() => ["60%", "90%"], []);

  const handleSheetChanges = useCallback(
    (index: number) => {
      // Closing the modal will reset the `modalAtom` for reuse.
      if (index === -1) closeModal(null);
    },
    [closeModal],
  );

  return (
    <BottomSheet
      onChange={handleSheetChanges}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      topInset={insets.top}
      backdropComponent={Backdrop}
      backgroundClassName="bg-surface800"
      handleIndicatorClassName="bg-surface500"
      {...(detached
        ? {
            detached: true,
            enableDynamicSizing: true,
            bottomInset: 32,
            backgroundComponent: Background,
            className: "mx-4 pb-4",
          }
        : {
            enableDynamicSizing: false,
            snapPoints: modalSnapPoints,
          })}
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

/** @description Custom background component for bottom sheet. */
function Background(props: BottomSheetBackgroundProps) {
  return <View {...props} className="rounded-xl" />;
}
