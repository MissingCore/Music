// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { TrueSheet } from "@lodev09/react-native-true-sheet";
import {
  createContext,
  use,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import type { ViewProps } from "react-native";
import { useWindowDimensions, View } from "react-native";
import type { AnimatedRef, SharedValue } from "react-native-reanimated";
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

import { cn } from "~/lib/style";
import { GestureHandlerRootView } from "~/components/Base/GestureHandlerRootView";
import type { LegendListProps } from "~/components/Base/LegendList";
import { LegendList } from "~/components/Base/LegendList";
import type { ScrollViewProps } from "~/components/Base/ScrollView";
import { ScrollView } from "~/components/Base/ScrollView";

const WrappedSheet = withUniwind(TrueSheet);

export type SheetRef = React.RefObject<TrueSheet | null>;

export function useSheetRef() {
  return useRef<TrueSheet>(null);
}

//#region Context
interface SheetContextValue {
  scrollableRef: AnimatedRef<any>;
  headerHeight: SharedValue<number>;
  footerHeight: SharedValue<number>;
  hasFooter: boolean;
}

const SheetContext = createContext<SheetContextValue>(null as never);
//#endregion

//#region Sheet
interface SheetProps {
  ref?: SheetRef;
  /** Makes sheet accessible globally using this key. */
  name?: string;
  draggable?: boolean;
  /** Render sheet at its max height. */
  snapTop?: boolean;
  /** Fires when the sheet is dismissed. */
  onCleanup?: VoidFunction;
  children: React.ReactNode;
  header?: React.ReactElement;
  footer?: React.ReactElement;
}

const MAX_SHEET_HEIGHT = 640;

/** Child nodes will automatically be wrapped with a `ScrollView`. */
export function Sheet({ snapTop, ...props }: SheetProps) {
  const { height } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const scrollableRef = useAnimatedRef();
  const headerHeight = useSharedValue(16);
  const footerHeight = useSharedValue(0);

  const hasFooter = !!props.footer;

  const contextValue = useMemo<SheetContextValue>(
    () => ({ scrollableRef, headerHeight, footerHeight, hasFooter }),
    [scrollableRef, headerHeight, footerHeight, hasFooter],
  );

  const contentStyle = useAnimatedStyle(() => {
    const maxHeight =
      Math.min(height, MAX_SHEET_HEIGHT) -
      top -
      bottom -
      headerHeight.get() -
      footerHeight.get() -
      32;
    return { height: snapTop ? maxHeight : undefined, maxHeight };
  });

  return (
    <SheetContext value={contextValue}>
      <WrappedSheet
        ref={props.ref}
        name={props.name}
        detents={["auto"]}
        scrollableRef={scrollableRef}
        scrollableOptions={{ contentInsetAdjustment: "never" }}
        dismissThreshold={snapTop ? "short" : undefined}
        draggable={props.draggable}
        onDidDismiss={() => props.onCleanup?.()}
        grabber={false}
        maxContentHeight={MAX_SHEET_HEIGHT}
        backgroundColor="transparent"
        cornerRadius={0}
        elevation={0}
        className="p-4 pt-0"
      >
        <View className="overflow-hidden rounded-xl bg-surfaceBright p-4 pt-0">
          <GestureHandlerRootView className="grow">
            {props.header ?? <SheetHeader />}
            <Animated.View style={contentStyle}>{props.children}</Animated.View>
            {props.footer}
          </GestureHandlerRootView>
        </View>
      </WrappedSheet>
    </SheetContext>
  );
}
//#endregion

//#region Decoration
export function SheetHeader({ children, onLayout, ...props }: ViewProps) {
  const { headerHeight } = use(SheetContext);
  return (
    <View
      onLayout={(e) => {
        headerHeight.set(e.nativeEvent.layout.height);
        onLayout?.(e);
      }}
      {...props}
    >
      <View className="mx-auto my-2.5 h-1 w-8 rounded-full bg-surfaceContainerHigh" />
      {children}
    </View>
  );
}

export function SheetFooter({ onLayout, className, ...props }: ViewProps) {
  const { footerHeight } = use(SheetContext);
  return (
    <View
      onLayout={(e) => {
        footerHeight.set(e.nativeEvent.layout.height);
        onLayout?.(e);
      }}
      {...props}
      className={cn("gap-4", className)}
    />
  );
}
//#endregion

//#region Scrollables
export function SheetLegendList<TData>({
  ref,
  className,
  contentContainerClassName,
  ...props
}: LegendListProps<TData>) {
  const { scrollableRef, hasFooter } = use(SheetContext);
  useImperativeHandle(ref, () => scrollableRef.current);
  return (
    <LegendList
      ref={scrollableRef}
      {...props}
      className={cn(!hasFooter && "-mb-4", className)}
      contentContainerClassName={cn("pb-4", contentContainerClassName)}
    />
  );
}

export function SheetScrollView({
  className,
  contentContainerClassName,
  ...props
}: Omit<ScrollViewProps, "ref">) {
  const { scrollableRef, hasFooter } = use(SheetContext);
  return (
    <ScrollView
      ref={scrollableRef}
      {...props}
      className={cn(!hasFooter && "-mb-4", className)}
      contentContainerClassName={cn("gap-4 pb-4", contentContainerClassName)}
    />
  );
}
//#endregion
