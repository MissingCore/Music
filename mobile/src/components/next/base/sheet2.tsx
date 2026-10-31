// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { createContext, use, useMemo, useRef } from "react";
import type { ViewProps } from "react-native";
import { View } from "react-native";
import type { AnimatedRef, SharedValue } from "react-native-reanimated";
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
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
export function Sheet(props: SheetProps) {
  const scrollableRef = useAnimatedRef();
  const headerHeight = useSharedValue(16);

  const contextValue = useMemo<SheetContextValue>(
    () => ({ scrollableRef, headerHeight }),
    [scrollableRef, headerHeight],
  );

  const containerStyle = useAnimatedStyle(() => ({
    paddingTop: headerHeight.get(),
  }));

  return (
    <SheetContext value={contextValue}>
      <WrappedSheet
        ref={props.ref}
        name={props.name}
        detents={["auto"]}
        scrollableRef={scrollableRef}
        scrollableOptions={{ contentInsetAdjustment: "footer" }}
        dismissThreshold={props.snapTop ? "short" : undefined}
        draggable={props.draggable}
        onDidDismiss={() => props.onCleanup?.()}
        grabber={false}
        header={props.header ?? <SheetHeader />}
        headerClassName="px-4"
        headerOptions={{ position: "absolute" }}
        footer={props.footer}
        footerClassName="p-4 pt-0"
        footerOptions={{ position: "absolute" }}
        maxContentHeight={MAX_SHEET_HEIGHT}
        backgroundColor="transparent"
        cornerRadius={0}
        elevation={0}
        className="px-4 pb-safe-offset-4"
      >
        <Animated.View
          style={containerStyle}
          className="overflow-hidden rounded-xl bg-surfaceBright p-4"
        >
          <GestureHandlerRootView className="grow">
            {props.children}
          </GestureHandlerRootView>
        </Animated.View>
      </WrappedSheet>
    </SheetContext>
  );
}
//#endregion

//#region Decoration
export function SheetHeader({
  className,
  children,
  onLayout,
  ...props
}: ViewProps) {
  const { headerHeight } = use(SheetContext);
  return (
    <View
      onLayout={(e) => {
        headerHeight.set(e.nativeEvent.layout.height);
        onLayout?.(e);
      }}
      {...props}
      className={cn("rounded-t-xl bg-surfaceBright px-4", className)}
    >
      <View className="mx-auto my-2.5 h-1 w-8 rounded-full bg-surfaceContainerHigh" />
      {children}
    </View>
  );
}

export function SheetFooter({ className, ...props }: ViewProps) {
  return (
    <View
      {...props}
      className={cn("gap-4 rounded-b-xl bg-surfaceBright p-4", className)}
    />
  );
}
//#endregion

//#region Scrollables
export function SheetLegendList({
  className,
  contentContainerClassName,
  ...props
}: Omit<LegendListProps, "ref">) {
  const { scrollableRef } = use(SheetContext);
  return (
    <LegendList
      ref={scrollableRef}
      {...props}
      className={cn("-mb-4", className)}
      contentContainerClassName={cn("pb-4", contentContainerClassName)}
    />
  );
}

export function SheetScrollView({
  className,
  contentContainerClassName,
  ...props
}: Omit<ScrollViewProps, "ref">) {
  const { scrollableRef } = use(SheetContext);
  return (
    <ScrollView
      ref={scrollableRef}
      {...props}
      className={cn("-mb-4", className)}
      contentContainerClassName={cn("gap-4 pb-4", contentContainerClassName)}
    />
  );
}
//#endregion
