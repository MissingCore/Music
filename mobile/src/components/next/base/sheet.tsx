// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { TrueSheet } from "@lodev09/react-native-true-sheet";
import React, { useMemo, useRef, useState } from "react";
import type { ViewProps } from "react-native";
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
  /** Render sheet at its max height. */
  snapTop?: boolean;
  /** Fires when the sheet is dismissed. */
  onCleanup?: VoidFunction;
  children: React.ReactNode;
}

const MAX_SHEET_HEIGHT = 640;

/** Child nodes will automatically be wrapped with a `ScrollView`. */
function Sheet(props: SheetProps) {
  const { header, footer, scrollableRef, children } = useSheetComponents(
    props.children,
  );
  const { maxHeight, setHeaderHeight, setFooterHeight } =
    useScrollableMaxHeight();

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
      onDidDismiss={() => props.onCleanup?.()}
      className="p-4 pt-0"
    >
      <View className="overflow-hidden rounded-xl bg-surfaceBright p-4 pt-0">
        <GestureHandlerRootView className="grow">
          <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
            <View className="mx-auto my-2.5 h-1 w-8 rounded-full bg-surfaceContainerHigh" />
            {header}
          </View>
          <View
            style={{ maxHeight, height: props.snapTop ? maxHeight : undefined }}
          >
            {children}
          </View>
          <View onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
            {footer}
          </View>
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
    const footer = nodes.find((n) => n?.type === Footer);
    const contentNodes = nodes.filter(
      (n) => n?.type !== Header && n?.type !== Footer,
    );

    //? We assume that if `Sheet.List` is rendered, then no other content is rendered.
    const list = contentNodes.find(
      (n) => n?.type === List || n?.props?.CustomList === List,
    );
    if (list) {
      const scrollableRef = list.props.ref ?? listRef;
      const children =
        list.props.ref == null
          ? React.cloneElement(list, { ref: listRef })
          : list;
      return { header, footer, scrollableRef, children };
    } else {
      return {
        header,
        footer,
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
  const [footerHeight, setFooterHeight] = useState(0);
  return useMemo(
    () => ({
      maxHeight:
        Math.min(height, MAX_SHEET_HEIGHT) -
        top -
        bottom -
        headerHeight -
        footerHeight -
        32,
      setHeaderHeight,
      setFooterHeight,
    }),
    [height, top, bottom, headerHeight, footerHeight],
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
  label?: string;
  children?: React.ReactNode;
  Leading?: React.ReactNode;
  Trailing?: React.ReactNode;
}) {
  return (
    <View>
      {props.label || props.Leading || props.Trailing ? (
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
      ) : null}
      {props.children}
    </View>
  );
}
//#endregion

//#region Footer
/**
 * Non-scrolling content we want appearing at the bottom of the sheet.
 *
 * Should be rendered as a direct child of `Sheet`.
 */
function Footer({ className, ...props }: Omit<ViewProps, "onLayout">) {
  return <View {...props} className={cn("pt-4", className)} />;
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
Sheet.Footer = Footer;

export { Sheet };
//#endregion
