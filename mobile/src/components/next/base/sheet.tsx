// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { TrueSheet } from "@lodev09/react-native-true-sheet";
import React, { useMemo, useRef, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { useAnimatedRef } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

import { cn } from "~/lib/style";
import { GestureHandlerRootView } from "~/components/Base/GestureHandlerRootView";
import type { LegendListProps } from "~/components/Base/LegendList";
import { LegendList } from "~/components/Base/LegendList";
import { ScrollView } from "~/components/Base/ScrollView";
import { Text } from "./typography";
import { Marquee } from "../blocks/marquee";

const WrappedSheet = withUniwind(TrueSheet);

export type SheetRef = React.RefObject<TrueSheet | null>;

export function useSheetRef() {
  return useRef<TrueSheet>(null);
}

//#region Sheet
interface SheetProps {
  ref?: SheetRef;
  /** Makes sheet accessible globally using this key. */
  name?: string;
  draggable?: boolean;
  /** Fires when the sheet is dismissed. */
  onCleanup?: VoidFunction;
  children: React.ReactNode;
}

const MAX_SHEET_HEIGHT = 640;

/** Child nodes will automatically be wrapped with a `ScrollView`. */
function Sheet(props: SheetProps) {
  const { header, scrollableRef, children } = useSheetComponents(
    props.children,
  );
  const { maxHeight, setHeaderHeight } = useScrollableMaxHeight();

  return (
    <WrappedSheet
      ref={props.ref}
      name={props.name}
      detents={["auto"]}
      scrollableRef={scrollableRef}
      scrollableOptions={{ contentInsetAdjustment: "never" }}
      draggable={props.draggable}
      maxContentHeight={MAX_SHEET_HEIGHT}
      backgroundColor="transparent"
      grabber={false}
      cornerRadius={0}
      elevation={0}
      onDidDismiss={() => {
        if (props.onCleanup) props.onCleanup();
      }}
      className="p-4 pt-0"
    >
      <View className="overflow-hidden rounded-xl bg-surfaceBright p-4 pt-0">
        <GestureHandlerRootView className="grow">
          <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
            <View className="mx-auto my-2.5 h-1 w-8 rounded-full bg-surfaceContainerHigh" />
            {header}
          </View>
          <View style={{ maxHeight }}>{children}</View>
        </GestureHandlerRootView>
      </View>
    </WrappedSheet>
  );
}

function useSheetComponents(children: React.ReactNode) {
  const listRef = useAnimatedRef();
  return useMemo(() => {
    const nodes: React.JSX.Element[] = (
      Array.isArray(children)
        ? children
        : // `flat(1)` is to handle fragments.
          React.Children.toArray(children).flat(1)
    ).filter((node) => node);

    const header = nodes.find((n) => n?.type === Header);
    const contentNodes = nodes.filter((n) => n?.type !== Header);

    //? We assume that if `Sheet.List` is rendered, then
    const list = contentNodes.find((n) => n.type === List);
    if (list) {
      const scrollableRef = list.props.ref ?? listRef;
      const children =
        list.props.ref == null
          ? React.cloneElement(list, { ref: listRef })
          : list;
      return { header, scrollableRef, children };
    } else {
      return {
        header,
        scrollableRef: listRef,
        children: (
          <ScrollView
            // @ts-expect-error - Ref should still work.
            ref={listRef}
            className="-mb-4"
            contentContainerClassName="gap-6 pb-4"
          >
            {contentNodes}
          </ScrollView>
        ),
      };
    }
  }, [children, listRef]);
}

/**
 * Identifoes the max height of the inner scrollable since it's auto-height
 * gets really funky when we render other components adjacent to it.
 */
function useScrollableMaxHeight() {
  const { height } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(0);
  return useMemo(
    () => ({
      maxHeight:
        Math.min(height, MAX_SHEET_HEIGHT) - top - bottom - headerHeight - 64,
      setHeaderHeight,
    }),
    [height, top, bottom, headerHeight],
  );
}
//#endregion

//#region Header
/**
 * Non-scrolling content we want appearing at the top of the sheet.
 *
 * Should be rendered as a direct child of `Sheet`.
 */
function Header(props: {
  label: string;
  children?: React.ReactNode;
  Leading?: React.ReactNode;
  Trailing?: React.ReactNode;
}) {
  return (
    <View>
      <View className="mb-6 flex-row items-center gap-2">
        {props.Leading}
        <Marquee
          wrapperClassName={cn(
            Boolean(props.Leading && props.Trailing) && "items-center",
          )}
        >
          <Text bold size="lg">
            {props.label}
          </Text>
        </Marquee>
        {props.Trailing}
      </View>
      {props.children}
    </View>
  );
}
//#endregion

//#region List
/**
 * Displays a list of items in the sheet. If rendered, will be the only
 * child rendered by the sheet.
 *
 * Should be rendered as a direct child of `Sheet`.
 */
function List<TData>(props: LegendListProps<TData>) {
  return (
    <LegendList
      {...props}
      className={cn("-mb-4", props.className)}
      contentContainerClassName={cn("pb-4", props.contentContainerClassName)}
    />
  );
}
//#endregion

//#region Exports
Sheet.Header = Header;
Sheet.List = List;

export { Sheet };
//#endregion
