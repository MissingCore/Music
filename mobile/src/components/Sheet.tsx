import { Toasts } from "@backpackapp-io/react-native-toast";
import type { TrueSheetProps } from "@lodev09/react-native-true-sheet";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { platformApiLevel } from "expo-device";
import { LinearGradient } from "expo-linear-gradient";
import type { ParseKeys } from "i18next";
import { cssInterop } from "nativewind";
import {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import { Easing, Pressable, View, useWindowDimensions } from "react-native";
import { easeGradient } from "react-native-easing-gradient";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "~/hooks/useTheme";

import { cn } from "~/lib/style";
import { Marquee } from "./Containment/Marquee";
import { Button } from "./Form/Button";
import { StyledText, TStyledText } from "./Typography/StyledText";

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

//#region Sheet
export function Sheet({
  ref,
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
  const internalRef = useSheetRef();
  useImperativeHandle(ref, () => internalRef.current!, [internalRef]);

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

  const closeSheet = useCallback(
    () => internalRef.current?.dismiss(),
    [internalRef],
  );

  return (
    <TrueSheet
      ref={internalRef}
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
      <HeaderApplicator
        title={titleKey ? t(titleKey) : undefined}
        getHeight={setHeaderHeight}
        onClose={closeSheet}
      >
        <WrappedGestureHandlerRootView
          style={[
            // TrueSheet doesn't know the actual scrollable area, so we
            // need to exclude the height taken up by the "SheetHeader"
            // from the container that can hold a scrollable.
            [{ maxHeight: trueScreenHeight - headerHeight }],
            contentContainerStyle,
          ]}
          className={cn(
            "gap-6 p-4 pt-0",
            { "h-full pb-0": snapTop },
            contentContainerClassName,
          )}
        >
          {children}
        </WrappedGestureHandlerRootView>
      </HeaderApplicator>
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
      {/*
        FIXME: A hack to give a non-transparent background to the area not
        taken up by our content.
      */}
      <View
        style={{ height: screenHeight }}
        className="absolute left-0 top-full w-full bg-canvasAlt"
      />
    </TrueSheet>
  );
}
//#endregion

//#region List Button
export function SheetButtonGroup(props: {
  leftButton: Omit<PressableProps, "children"> & { textKey: ParseKeys };
  rightButton: Omit<PressableProps, "children"> & { textKey: ParseKeys };
  className?: string;
}) {
  return (
    <View className={cn("flex-row gap-[3px]", props.className)}>
      <Button
        {...props.leftButton}
        className={cn(
          "min-h-14 flex-1 rounded-r-sm",
          props.leftButton.className,
        )}
      >
        <TStyledText
          textKey={props.leftButton.textKey}
          className="text-center text-sm"
          bold
        />
      </Button>
      <Button
        {...props.rightButton}
        className={cn(
          "min-h-14 flex-1 rounded-l-sm",
          props.rightButton.className,
        )}
      >
        <TStyledText
          textKey={props.rightButton.textKey}
          className="text-center text-sm"
          bold
        />
      </Button>
    </View>
  );
}
//#endregion

//#region Internal
const GRADIENT_HEIGHT = 96;

function HeaderApplicator(props: {
  onClose: VoidFunction;
  getHeight: (height: number) => void;
  title?: string;
  children: React.ReactNode;
}) {
  const { theme, canvasAlt } = useTheme();
  const { colors, locations } = useMemo(
    () =>
      easeGradient({
        colorStops: {
          0: { color: `${canvasAlt}00` },
          ...(theme === "dark"
            ? {
                0.25: { color: `${canvasAlt}66` },
                0.65: { color: `${canvasAlt}D9` },
                0.8: { color: canvasAlt },
              }
            : {}),
          1: { color: canvasAlt },
        } as Record<number, { color: string }>,
        easing: theme === "dark" ? Easing.linear : undefined,
      }),
    [theme, canvasAlt],
  );
  return (
    <>
      <Pressable
        accessible={false}
        onPress={props.onClose}
        className="absolute left-0 top-0 z-50 h-14 w-full"
      />
      <LinearGradient
        colors={colors as [string, string, ...string[]]}
        locations={locations as [number, number, ...number[]]}
        style={{ height: GRADIENT_HEIGHT }}
      />
      {/*
        FIXME: Weird issue which occurs on some devices, which is a random
        horizontal line appears under the header depending on the bottom padding.
      */}
      <View className="bg-canvasAlt">
        <View
          onLayout={(e) =>
            props.getHeight(e.nativeEvent.layout.height + GRADIENT_HEIGHT)
          }
          className={cn("px-4 pb-6", { "pb-2": !props.title })}
        >
          {props.title ? (
            <Marquee center>
              <StyledText className="text-lg">{props.title}</StyledText>
            </Marquee>
          ) : null}
        </View>
        {props.children}
      </View>
    </>
  );
}
//#endregion
