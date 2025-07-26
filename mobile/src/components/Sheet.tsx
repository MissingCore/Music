import { Toasts } from "@backpackapp-io/react-native-toast";
import type { TrueSheetProps } from "@lodev09/react-native-true-sheet";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { platformApiLevel } from "expo-device";
import { LinearGradient } from "expo-linear-gradient";
import type { ParseKeys } from "i18next";
import { cssInterop } from "nativewind";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { StyleProp, ViewStyle } from "react-native";
import { View, useWindowDimensions } from "react-native";
import { easeGradient } from "react-native-easing-gradient";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "~/hooks/useTheme";

import { cn } from "~/lib/style";
import { Marquee } from "./Containment/Marquee";
import { StyledText } from "./Typography/StyledText";

const WrappedGestureHandlerRootView = cssInterop(GestureHandlerRootView, {
  className: "style",
});

interface SheetProps extends Omit<TrueSheetProps, "name"> {
  titleKey?: ParseKeys;
  /** Makes sheet accessible globally using this key. */
  globalKey?: string;
  /** If the sheet should open at max screen height. */
  snapTop?: boolean;
  contentContainerClassName?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export type TrueSheetRef = React.Ref<TrueSheet>;

export function useSheetRef() {
  return useRef<TrueSheet>(null);
}

export function Sheet({
  titleKey,
  globalKey,
  snapTop,
  contentContainerClassName,
  contentContainerStyle,
  children,
  onPresent,
  onDismiss,
  ...props
}: SheetProps & { ref?: TrueSheetRef }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [enableToast, setEnableToast] = useState(false);
  const [disableToastAnim, setDisableToastAnim] = useState(true);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const disableAnimTimerRef = useRef<number>(null);

  // In Android API 35+, the "height" now includes the system decoration
  // areas and display cutout (status & navigation bar heights).
  //  - https://github.com/facebook/react-native/issues/47080#issuecomment-2421914957
  const trueScreenHeight = useMemo(() => {
    if (!platformApiLevel || platformApiLevel < 35) return screenHeight;
    return screenHeight - insets.top - insets.bottom;
  }, [insets.bottom, insets.top, screenHeight]);

  return (
    <TrueSheet
      onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
      name={globalKey}
      sizes={[snapTop ? "large" : "auto"]}
      backgroundColor="transparent"
      cornerRadius={0}
      maxHeight={trueScreenHeight}
      grabber={false}
      onPresent={(e) => {
        if (onPresent) onPresent(e);
        setEnableToast(true);

        // Temporarily disable toast mount animation when sheet is presenting.
        if (disableAnimTimerRef.current)
          clearTimeout(disableAnimTimerRef.current);
        disableAnimTimerRef.current = setTimeout(
          () => setDisableToastAnim(false),
          250,
        );
      }}
      onDismiss={() => {
        if (onDismiss) onDismiss();
        setEnableToast(false);

        // Ensure that toast mount animation is disabled when sheet presents.
        if (disableAnimTimerRef.current)
          clearTimeout(disableAnimTimerRef.current);
        setDisableToastAnim(true);
      }}
      {...props}
    >
      <SheetHeader
        title={titleKey ? t(titleKey) : undefined}
        getHeight={setHeaderHeight}
      />
      <WrappedGestureHandlerRootView
        style={[
          // TrueSheet doesn't know the actual scrollable area, so we
          // need to exclude the height taken up by the "SheetHeader"
          // from the container that can hold a scrollable.
          [{ maxHeight: trueScreenHeight - headerHeight }],
          contentContainerStyle,
        ]}
        className={cn(
          "bg-canvasAlt p-4 pt-0",
          { "h-full pb-0": snapTop },
          contentContainerClassName,
        )}
      >
        {children}
      </WrappedGestureHandlerRootView>
      {enableToast ? (
        <Toasts
          // @ts-expect-error - We added the `sheetOpts` prop via a patch.
          sheetOpts={{
            height: sheetHeight,
            needKeyboardOffset: props.keyboardMode === "pan",
          }}
          // A duration of 0 doesn't work.
          globalAnimationConfig={disableToastAnim ? { duration: 1 } : undefined}
        />
      ) : null}
    </TrueSheet>
  );
}

/** Header component to be used in `<Sheet />`. */
function SheetHeader(props: {
  getHeight: (height: number) => void;
  title?: string;
}) {
  const { canvasAlt } = useTheme();
  const { colors, locations } = useMemo(
    () =>
      easeGradient({
        colorStops: { 0: { color: `${canvasAlt}00` }, 1: { color: canvasAlt } },
      }),
    [],
  );
  return (
    <View onLayout={(e) => props.getHeight(e.nativeEvent.layout.height)}>
      <LinearGradient
        colors={colors}
        locations={locations}
        style={{ height: 96 }}
      />
      <View className={cn("bg-canvasAlt px-4 pb-2", { "pb-6": !!props.title })}>
        {props.title ? (
          <Marquee center>
            <StyledText className="text-lg">{props.title}</StyledText>
          </Marquee>
        ) : null}
      </View>
    </View>
  );
}
