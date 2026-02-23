import { Toasts } from "@backpackapp-io/react-native-toast";
import type { TrueSheetProps } from "@lodev09/react-native-true-sheet";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import type { ParseKeys } from "i18next";
import { useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useIsKeyboardVisible } from "~/stores/ListenerState";
import { useSafeAreaHeight } from "~/hooks/useSafeAreaHeight";

import { cn } from "~/lib/style";
import type { TrueSheetRef } from "./useSheetRef";
import { GestureHandlerRootView } from "../Base/GestureHandlerRootView";
import { Marquee } from "../Marquee";
import { TEm } from "../Typography/StyledText";

interface SheetProps extends Pick<
  TrueSheetProps,
  "children" | "draggable" | "onBackPress" | "onPositionChange"
> {
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
  /** Gap between content in sheet. Defaults to `24`. */
  gap?: number;
  /** Styles applied to the internal `GestureHandlerRootView`. */
  contentContainerClassName?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/** Distance between the bottom of the sheet & the navbar / bottom of screen. */
const EDGE_SPACER = 16;
const ESTIMATED_TOPAPPBAR_HEIGHT = 56;
const MAX_SHEET_HEIGHT = 576;

/**
 * Get the max height of the detached sheet.
 * - This includes the spacer & inset at the bottom.
 */
export function useMaxDetachedSheetHeight() {
  const { bottom } = useSafeAreaInsets();
  const safeHeight = useSafeAreaHeight();

  // `safeHeight` includes `EDGE_SPACER` in the calculation.
  const workableHeight = safeHeight + bottom - ESTIMATED_TOPAPPBAR_HEIGHT;
  // If sheet utilizes full height, part of the sheet will end up behind
  // the navbar unless we include the bottom inset.
  const maxDetachedHeight = MAX_SHEET_HEIGHT + EDGE_SPACER + bottom;
  return Math.min(workableHeight, maxDetachedHeight);
}

export function DetachedSheet(props: SheetProps) {
  const { bottom } = useSafeAreaInsets();
  const keyboardVisible = useIsKeyboardVisible();
  const maxHeight = useMaxDetachedSheetHeight();
  const [sheetHeight, setSheetHeight] = useState(0);
  const [disableToastAnim, setDisableToastAnim] = useState(true);

  const gap = props.gap ?? 24;

  return (
    <TrueSheet
      ref={props.ref}
      onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
      name={props.globalKey}
      detents={[props.snapTop ? 1 : "auto"]}
      backgroundColor="transparent"
      cornerRadius={0}
      maxHeight={maxHeight}
      grabber={false}
      draggable={props.draggable}
      // Re-enable toast animations after sheet is finished presenting.
      onDidPresent={() => setDisableToastAnim(false)}
      onDidDismiss={() => {
        if (props.onCleanup) props.onCleanup();
        // Disable toast animations when sheet is dismissed.
        setDisableToastAnim(true);
      }}
      // Events used for `<DetachedDimView />`.
      onBackPress={props.onBackPress}
      onPositionChange={props.onPositionChange}
    >
      <View
        style={{
          maxHeight: maxHeight - (EDGE_SPACER + bottom),
          marginHorizontal: EDGE_SPACER,
          // When the keyboard is open, the bottom inset is applied twice
          // if the sheet isn't at max height.
          marginBottom: EDGE_SPACER - (keyboardVisible ? bottom : 0),
        }}
        className={cn("overflow-hidden rounded-xl bg-surfaceBright", {
          "h-full": props.snapTop,
        })}
      >
        <GestureHandlerRootView
          style={[
            { maxHeight: maxHeight - (EDGE_SPACER + bottom), gap },
            props.contentContainerStyle,
          ]}
          className={cn(
            "relative p-4 pt-0",
            { "h-full pb-0": props.snapTop },
            props.contentContainerClassName,
          )}
        >
          <View
            // If we have no title, have a `8px` gap between the "header" & content.
            style={[!props.titleKey && { marginBottom: -gap + 8 }]}
            className="gap-1"
          >
            <View className="mx-auto my-2.5 h-1 w-8 rounded-full bg-surfaceContainerHigh" />
            {props.titleKey ? (
              <Marquee color="surfaceBright">
                <TEm textKey={props.titleKey} className="text-lg" />
              </Marquee>
            ) : null}
          </View>
          {props.children}
        </GestureHandlerRootView>
      </View>
      <Toasts
        // @ts-expect-error - We added the `sheetOpts` prop via a patch.
        sheetOpts={{
          height: sheetHeight - bottom,
          needKeyboardOffset: props.keyboardAndToast,
        }}
        // A duration of 0 doesn't work.
        globalAnimationConfig={disableToastAnim ? { duration: 1 } : undefined}
      />
    </TrueSheet>
  );
}
