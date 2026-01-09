import { Toasts } from "@backpackapp-io/react-native-toast";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import type { ParseKeys } from "i18next";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { withUniwind } from "uniwind";

import { useSafeAreaHeight } from "~/hooks/useSafeAreaHeight";
import { useTheme } from "~/hooks/useTheme";

import { BorderRadius } from "~/constants/Styles";
import { cn } from "~/lib/style";
import type { TrueSheetRef } from "./useSheetRef";
import { Marquee } from "../Marquee";
import { StyledText } from "../Typography/StyledText";

const WrappedGestureHandlerRootView = withUniwind(GestureHandlerRootView);

interface SheetProps {
  children: React.ReactNode;
  ref?: TrueSheetRef;
  /** Makes sheet accessible globally using this key. */
  globalKey?: string;
  /** Title displayed in sheet. */
  titleKey?: ParseKeys;
  /** Fires when the sheet is dismissed. */
  onCleanup?: VoidFunction;
  /** If the sheet should open at max screen height. */
  snapTop?: boolean;
  /** Indicates a sheet can display keyboard & toast. */
  keyboardAndToast?: boolean;
  /** Styles applied to the internal `GestureHandlerRootView`. */
  contentContainerClassName?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function Sheet(props: SheetProps) {
  const { t } = useTranslation();
  const { canvasAlt } = useTheme();
  const [disableToastAnim, setDisableToastAnim] = useState(true);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);

  const trueScreenHeight = useSafeAreaHeight();

  return (
    <TrueSheet
      ref={props.ref}
      onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
      name={props.globalKey}
      detents={[props.snapTop ? 1 : "auto"]}
      backgroundColor={canvasAlt}
      cornerRadius={BorderRadius.lg}
      // Sheet max height will be just before the `<TopAppBar />`.
      maxHeight={trueScreenHeight - 56}
      grabber={false}
      // Re-enable toast animations after sheet is finished presenting.
      onDidPresent={() => setDisableToastAnim(false)}
      onDidDismiss={() => {
        if (props.onCleanup) props.onCleanup();
        // Disable toast animations when sheet is dismissed.
        setDisableToastAnim(true);
      }}
    >
      <View
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        className={cn("gap-2 px-4 pb-2", { "pb-6": !!props.titleKey })}
      >
        <View className="mx-auto my-2.5 h-1 w-8 rounded-full bg-onSurface" />
        {props.titleKey ? (
          <Marquee color="surfaceBright" center>
            <StyledText className="text-lg">{t(props.titleKey)}</StyledText>
          </Marquee>
        ) : null}
      </View>
      <WrappedGestureHandlerRootView
        style={[
          // TrueSheet doesn't know the actual scrollable area, so we
          // need to exclude the height taken up by the "SheetHeader"
          // from the container that can hold a scrollable.
          [{ maxHeight: trueScreenHeight - 56 - headerHeight }],
          props.contentContainerStyle,
        ]}
        className={cn(
          "gap-6 p-4 pt-0",
          { "h-full pb-0": props.snapTop },
          props.contentContainerClassName,
        )}
      >
        {props.children}
      </WrappedGestureHandlerRootView>
      <Toasts
        // @ts-expect-error - We added the `sheetOpts` prop via a patch.
        sheetOpts={{
          height: sheetHeight,
          needKeyboardOffset: props.keyboardAndToast,
        }}
        // A duration of 0 doesn't work.
        globalAnimationConfig={disableToastAnim ? { duration: 1 } : undefined}
      />
    </TrueSheet>
  );
}
