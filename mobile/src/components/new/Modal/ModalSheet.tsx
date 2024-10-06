import type {
  BottomSheetBackdropProps,
  BottomSheetProps,
} from "@gorhom/bottom-sheet";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { cssInterop } from "nativewind";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { BackHandler, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StyledText } from "../Typography";

const WrappedBottomSheetModal = cssInterop(BottomSheetModal, {
  className: "style",
  backgroundClassName: "backgroundStyle",
  handleClassName: "handleStyle",
  handleIndicatorClassName: "handleIndicatorStyle",
});

/** "Standardized" bottom sheet modal. */
export const ModalSheet = forwardRef<
  BottomSheetModal,
  BottomSheetProps & {
    /** Title of modal that'll be displayed. */
    title?: string;
    /** If the sheet should open at max screen height. */
    snapTop?: boolean;
  }
>(function ModalSheet({ children, title, snapTop, ...props }, ref) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const internalRef = useRef<BottomSheetModal>(null);
  // Forward the value of the internal ref to the external ref.
  useImperativeHandle(ref, () => internalRef.current!, []);

  const insets = useSafeAreaInsets();

  const snapPoints = useMemo(() => ["100%"], []);

  /* Close modal if we detect a back gesture/action. */
  useEffect(() => {
    const onBackPress = () => {
      internalRef.current?.close();
      // Since the modal is still technically rendered when dismissed,
      // the `currentIndex` check will allow for normal behavior if the
      // modal is closed.
      return currentIndex !== -1 ? true : false;
    };

    BackHandler.addEventListener("hardwareBackPress", onBackPress);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    };
  }, [currentIndex]);

  return (
    <WrappedBottomSheetModal
      ref={internalRef}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      // Have sheet max height be right before the header bar.
      topInset={insets.top + 56}
      backdropComponent={Backdrop}
      className="px-4"
      backgroundClassName="rounded-t-lg bg-canvas dark:bg-neutral5"
      handleIndicatorClassName="my-1 bg-onSurface"
      // `enableDynamicSizing` defaults to `true` for `<BottomSheetModal />`.
      {...(snapTop ? { snapPoints, enableDynamicSizing: false } : {})}
      {...props}
      onChange={(...args) => {
        setCurrentIndex(args[0]);
        if (props.onChange) props.onChange(...args);
      }}
    >
      <BottomSheetScrollView
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-canvas pb-4 dark:bg-neutral5">
          {title ? (
            <StyledText className="text-center text-lg">{title}</StyledText>
          ) : null}
        </View>
        {children}
      </BottomSheetScrollView>
    </WrappedBottomSheetModal>
  );
});

/**
 * Make sure the backdrop appears whenever the sheet appears and not on
 * its 2nd breakpoint.
 */
function Backdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
  );
}
