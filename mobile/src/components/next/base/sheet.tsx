// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { TrueSheetProps } from "@lodev09/react-native-true-sheet";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { createContext, use, useImperativeHandle, useRef } from "react";
import type { ViewProps } from "react-native";
import { View } from "react-native";
import type { AnimatedRef } from "react-native-reanimated";
import { useAnimatedRef } from "react-native-reanimated";
import { withUniwind } from "uniwind";

import { cn } from "~/lib/style";
import { GestureHandlerRootView } from "~/components/Base/GestureHandlerRootView";
import type { LegendListProps } from "~/components/Base/LegendList";
import { LegendList } from "~/components/Base/LegendList";
import type { ScrollViewProps } from "~/components/Base/ScrollView";
import { ScrollView } from "~/components/Base/ScrollView";
import { useTheme } from "~/modules/customization/theme/hooks";

const WrappedSheet = withUniwind(TrueSheet);

export type SheetRef = React.RefObject<TrueSheet | null>;

export function useSheetRef() {
  return useRef<TrueSheet>(null);
}

//#region Scroll Context
const ScrollableRefContext = createContext<AnimatedRef<any>>(null as never);
//#endregion

//#region Sheet
interface SheetProps extends Pick<
  TrueSheetProps,
  "name" | "lazy" | "draggable" | "children" | "header" | "footer"
> {
  ref?: SheetRef;
  /** Render sheet at its max height. */
  snapTop?: boolean;
  /** Fires when the sheet is dismissed. */
  onCleanup?: VoidFunction;
}

const MAX_SHEET_HEIGHT = 640;

/** Child nodes will automatically be wrapped with a `ScrollView`. */
export function Sheet(props: SheetProps) {
  const { surfaceBright } = useTheme();
  const scrollableRef = useAnimatedRef();
  return (
    <ScrollableRefContext value={scrollableRef}>
      <WrappedSheet
        ref={props.ref}
        name={props.name}
        detents={[props.snapTop ? 1 : "auto"]}
        lazy={props.lazy}
        scrollableRef={scrollableRef}
        dismissThreshold={props.snapTop ? "short" : undefined}
        draggable={props.draggable}
        onDidDismiss={() => props.onCleanup?.()}
        grabber={false}
        maxContentHeight={MAX_SHEET_HEIGHT}
        header={props.header ?? <SheetHeader />}
        //? We get incorrect automatic insets for `SheetLegendList` if we
        //? don't provide a footer.
        footer={props.footer ?? <View />}
        footerOptions={{ position: "absolute" }}
        footerClassName="bg-surfaceBright"
        backgroundColor={surfaceBright}
        cornerRadius={24}
      >
        <GestureHandlerRootView className="grow px-4">
          {props.children}
        </GestureHandlerRootView>
      </WrappedSheet>
    </ScrollableRefContext>
  );
}
//#endregion

//#region Decoration
export function SheetHeader({ children, className, ...props }: ViewProps) {
  return (
    <View {...props} className={cn("px-4", className)}>
      <View className="mx-auto my-2.5 h-1 w-8 rounded-full bg-surfaceContainerHigh" />
      {children}
    </View>
  );
}

export function SheetFooter({ className, ...props }: ViewProps) {
  return (
    <View
      //! Needs to be specified as otherwise, we can press any buttons behind
      //! the absolute-positioned footer.
      collapsable={false}
      {...props}
      className={cn("gap-4 p-4", className)}
    />
  );
}
//#endregion

//#region Scrollables
export function SheetLegendList<TData>({
  ref,
  contentContainerClassName,
  ...props
}: LegendListProps<TData>) {
  const scrollableRef = use(ScrollableRefContext);
  useImperativeHandle(ref, () => scrollableRef.current);
  return (
    <LegendList
      ref={scrollableRef}
      {...props}
      contentContainerClassName={cn("pb-4", contentContainerClassName)}
    />
  );
}
//#endregion

//#region Scrollable Sheet
/** Sheet with contents wrapped in `ScrollView`. */
export function ScrollableSheet({
  children,
  className,
  contentContainerClassName,
  ...props
}: SheetProps & { className?: string; contentContainerClassName?: string }) {
  return (
    <Sheet {...props}>
      <SheetScrollView
        className={className}
        contentContainerClassName={contentContainerClassName}
      >
        {children}
      </SheetScrollView>
    </Sheet>
  );
}

function SheetScrollView({
  contentContainerClassName,
  ...props
}: Omit<ScrollViewProps, "ref">) {
  const scrollableRef = use(ScrollableRefContext);
  return (
    <ScrollView
      ref={scrollableRef}
      {...props}
      contentContainerClassName={cn("gap-4 pb-4", contentContainerClassName)}
    />
  );
}
//#endregion
