// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { TrueSheetProps } from "@lodev09/react-native-true-sheet";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { createContext, use, useRef } from "react";
import type { ViewProps } from "react-native";
import { View } from "react-native";
import type { AnimatedRef } from "react-native-reanimated";
import { useAnimatedRef } from "react-native-reanimated";
import { withUniwind } from "uniwind";

import { useTheme } from "~/_next/context/theme-context";

import { cn } from "~/_next/utils/style";
import type { ScrollViewProps } from "~/_next/components/primitives/scroll-view";
import { ScrollView } from "~/_next/components/primitives/scroll-view";

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
  "name" | "dismissible" | "children" | "header"
> {
  ref?: SheetRef;

  /** Callback to know if the sheet is presented or not. */
  setVisibility?: (visible: boolean) => void;
}

export function Sheet(props: SheetProps) {
  const { background: backgroundColor } = useTheme().colors;
  const scrollableRef = useAnimatedRef();
  return (
    <ScrollableRefContext value={scrollableRef}>
      <WrappedSheet
        ref={props.ref}
        name={props.name}
        detents={["auto"]}
        scrollableRef={scrollableRef}
        dismissible={props.dismissible}

        onWillPresent={() => props.setVisibility?.(true)}
        onDidDismiss={() => props.setVisibility?.(false)}

        header={props.header ?? <SheetHeader />}
        headerStyle={{ backgroundColor }}
        //? We get incorrect automatic insets for `SheetLegendList` if we
        //? don't provide a footer with a height.
        footer={<View className="h-px" />}
        footerOptions={{ position: "absolute" }}

        grabber={false}
        cornerRadius={24}
        backgroundColor={backgroundColor}
        style={{ backgroundColor }}
      >
        {props.children}
      </WrappedSheet>
    </ScrollableRefContext>
  );
}
//#endregion

//#region Decoration
export function SheetHeader({
  children,
  showHandle = true,
  ...props
}: ViewProps & { showHandle?: boolean }) {
  const { border } = useTheme().colors;
  return (
    <View {...props}>
      {showHandle ? (
        <View
          style={{ backgroundColor: border }}
          className="mx-auto my-2.5 h-1 w-8 rounded-full"
        />
      ) : (
        <View className="h-2.5" />
      )}
      {children}
    </View>
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
      contentContainerClassName={cn("gap-4 p-4", contentContainerClassName)}
    />
  );
}
//#endregion
