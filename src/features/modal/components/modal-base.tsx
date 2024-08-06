import type {
  BottomSheetBackdropProps,
  BottomSheetBackgroundProps,
  BottomSheetModal,
  BottomSheetProps,
} from "@gorhom/bottom-sheet";
import _BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import type { PrimitiveAtom } from "jotai";
import { useSetAtom } from "jotai";
import { cssInterop } from "nativewind";
import { forwardRef, useCallback, useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { modalAtom } from "../store";

const BottomSheet = cssInterop(_BottomSheet, {
  className: "style",
  backgroundClassName: "backgroundStyle",
  handleClassName: "handleStyle",
  handleIndicatorClassName: "handleIndicatorStyle",
});

/** Bottom sheet w/ 2 different designs based on the value of `detached`. */
export const ModalBase = forwardRef<
  BottomSheetModal,
  BottomSheetProps & { modalControlAtom?: PrimitiveAtom<any> }
>(function ModalBase({ detached, children, modalControlAtom, ...props }, ref) {
  const insets = useSafeAreaInsets();
  const closeModal = useSetAtom(modalControlAtom ?? modalAtom);

  const modalSnapPoints = useMemo(() => ["60%", "90%"], []);

  const handleOnClose = useCallback(() => closeModal(null), [closeModal]);

  return (
    <BottomSheet
      ref={ref}
      onClose={handleOnClose}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      topInset={insets.top}
      backdropComponent={Backdrop}
      backgroundComponent={Background}
      backgroundClassName="bg-surface800"
      handleIndicatorClassName="bg-surface500"
      {...(detached
        ? {
            detached: true,
            enableDynamicSizing: true,
            bottomInset: 32,
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
});

/** Our version of `<BottomSheetBackdrop />`. */
function Backdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
  );
}

/** Custom background component for bottom sheet. */
function Background(props: BottomSheetBackgroundProps) {
  return <View {...props} className="rounded-xl" />;
}
