import type { TrueSheetProps } from "@lodev09/react-native-true-sheet";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import type { ParseKeys } from "i18next";
import { useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { withUniwind } from "uniwind";

import { useSafeAreaHeight } from "~/hooks/useSafeAreaHeight";

import { cn } from "~/lib/style";
import type { TrueSheetRef } from "./index";
import { Marquee } from "../Containment/Marquee";
import { TStyledText } from "../Typography/StyledText";

const WrappedGestureHandlerRootView = withUniwind(GestureHandlerRootView);

interface SheetProps extends Pick<TrueSheetProps, "children" | "scrollable"> {
  ref?: TrueSheetRef;
  /** Makes sheet accessible globally using this key. */
  globalKey?: string;
  /** Title displayed in sheet. */
  titleKey?: ParseKeys;
  /** If the sheet should open at max screen height. */
  snapTop?: boolean;
  /** Styles applied to the internal `GestureHandlerRootView`. */
  contentContainerClassName?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/** Distance between the bottom of the sheet & the navbar / bottom of screen. */
const EDGE_SPACER = 8;
const MAX_SHEET_HEIGHT = 512;

/** Get the max height of the detached sheet (which includes the spacer at the bottom). */
export function useMaxDetachedSheetHeight() {
  const safeHeight = useSafeAreaHeight();
  return useMemo(
    // `safeHeight` includes `EDGE_SPACER` in the calculation.
    () => Math.min(safeHeight, MAX_SHEET_HEIGHT + EDGE_SPACER),
    [safeHeight],
  );
}

export function DetachedSheet(props: SheetProps) {
  const maxHeight = useMaxDetachedSheetHeight();
  return (
    <TrueSheet
      ref={props.ref}
      name={props.globalKey}
      detents={[props.snapTop ? 1 : "auto"]}
      backgroundColor="transparent"
      cornerRadius={0}
      maxHeight={maxHeight}
      grabber={false}
    >
      <View
        style={{
          maxHeight: maxHeight - EDGE_SPACER,
          marginHorizontal: EDGE_SPACER,
          marginBottom: EDGE_SPACER,
        }}
        className={cn("overflow-hidden rounded-lg bg-canvasAlt", {
          "h-full": props.snapTop,
        })}
      >
        <WrappedGestureHandlerRootView
          style={[
            { maxHeight: maxHeight - EDGE_SPACER },
            props.contentContainerStyle,
          ]}
          className={cn(
            "gap-6 p-4 pt-0",
            { "h-full pb-0": props.snapTop },
            props.contentContainerClassName,
          )}
        >
          <View className="gap-2">
            <View className="mx-auto my-2.5 h-1 w-8 rounded-full bg-onSurface" />
            {props.titleKey ? (
              <Marquee color="canvasAlt">
                <TStyledText
                  textKey={props.titleKey}
                  bold
                  className="text-lg"
                />
              </Marquee>
            ) : null}
          </View>
          {props.children}
        </WrappedGestureHandlerRootView>
      </View>
    </TrueSheet>
  );
}
