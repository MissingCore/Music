// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { Portal } from "@rn-primitives/portal";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ViewStyle } from "react-native";
import { BackHandler, useWindowDimensions } from "react-native";
import type { AnimatedProps } from "react-native-reanimated";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  FadeOutUp,
  useAnimatedRef,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSafeAreaHeight } from "~/hooks/useSafeAreaHeight";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { Pressable } from "./Base/Pressable";

interface MenuProps extends AnimatedProps<typeof Animated.View> {
  visible: boolean;
  anchor: React.ReactNode;
  /** If menu appears above or below the anchor. Defaults to `bottom`. */
  anchorPosition?: "top" | "bottom";
  /** If menu expands left or right of the anchor. Defaults to `right`. */
  anchorEdge?: "left" | "right";
  /** If pressing outside the menu will close the menu. */
  dismissHandling?: boolean;
  /**
   * Handler that get called when menu is closed when `dismissHandling = true`.
   * This should set `visible = false`.
   */
  onDismiss?: VoidFunction;
  /** Gap between rendered menu & anchor. */
  menuGap?: number;
  /** Styles container wrapping menu items. */
  menuStyle?: ViewStyle;
  /** Styles container wrapping menu items. */
  menuClassName?: string;
  /** Items rendered inside the menu. */
  children: React.ReactNode;
}

type MenuPosition = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

export function Menu({
  visible,
  anchor,
  anchorPosition = "bottom",
  anchorEdge = "right",
  dismissHandling = false,
  onDismiss,
  menuGap = 8,
  menuStyle,
  menuClassName,
  children,
  ...props
}: MenuProps) {
  const { top, bottom } = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const safeHeight = useSafeAreaHeight();
  const animatedRef = useAnimatedRef();
  const menuPosRef = useRef<MenuPosition>({});
  const prevVisible = useRef(false);
  const [rendered, setRendered] = useState(false);

  //* Determine where the menu will be positioned on the screen.
  const measurePosition = useCallback(() => {
    animatedRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      const newMenuPos: MenuPosition = {
        top: pageY + height + menuGap,
        bottom: safeHeight + top + bottom + menuGap - pageY,
        [OnRTL.decide("right", "left")]: pageX,
        [OnRTL.decide("left", "right")]: screenWidth - width - pageX,
      };

      delete newMenuPos[anchorEdge === "left" ? "right" : "left"];
      delete newMenuPos[anchorPosition === "top" ? "top" : "bottom"];

      menuPosRef.current = newMenuPos;
    });
  }, [
    animatedRef,
    anchorEdge,
    anchorPosition,
    menuGap,
    bottom,
    top,
    safeHeight,
    screenWidth,
  ]);

  //* Figure out where the menu should be rendered before presenting.
  useEffect(() => {
    if (prevVisible.current !== visible) {
      prevVisible.current = visible;
      measurePosition();
      setRendered(visible);
    }
  }, [measurePosition, visible]);

  //* Back gesture will close the menu.
  useEffect(() => {
    if (!dismissHandling || !onDismiss) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (!visible) return false;
        onDismiss();
        return true;
      },
    );
    return () => subscription.remove();
  }, [visible, dismissHandling, onDismiss]);

  return (
    <>
      <Animated.View ref={animatedRef} {...props}>
        {anchor}
      </Animated.View>

      {rendered ? (
        <Portal name="menu-portal">
          {dismissHandling ? (
            <Pressable onPress={onDismiss} className="absolute inset-0" />
          ) : null}
          <Animated.View
            entering={anchorPosition === "top" ? FadeInDown : FadeInUp}
            exiting={anchorPosition === "top" ? FadeOutDown : FadeOutUp}
            style={[menuStyle, menuPosRef.current]}
            className={cn(menuClassName, "absolute")}
          >
            {children}
          </Animated.View>
        </Portal>
      ) : null}
    </>
  );
}
