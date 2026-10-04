// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { TrueSheet } from "@lodev09/react-native-true-sheet";
import React, { useMemo } from "react";
import { View } from "react-native";
import { useAnimatedRef } from "react-native-reanimated";
import { withUniwind } from "uniwind";

import { cn } from "~/lib/style";
import type { LegendListProps } from "~/components/Base/LegendList";
import { LegendList } from "~/components/Base/LegendList";
import { ScrollView } from "~/components/Base/ScrollView";
import { GestureHandlerRootView } from "~/components/Base/GestureHandlerRootView";
import { Text } from "./typography";
import { Marquee } from "../blocks/marquee";

const WrappedSheet = withUniwind(TrueSheet);

export type SheetRef = React.RefObject<TrueSheet | null>;

//#region Sheet
interface SheetProps {
  ref?: SheetRef;
  name?: string;
  draggable?: boolean;
  children: React.ReactNode;
}

/** Child nodes will automatically be wrapped with a `ScrollView`. */
export function Sheet(props: SheetProps) {
  const { header, scrollableRef, children } = useSheetComponents(
    props.children,
  );
  return (
    <WrappedSheet
      ref={props.ref}
      name={props.name}
      detents={["auto"]}
      scrollableRef={scrollableRef}
      draggable={props.draggable}
      backgroundColor="transparent"
      grabber={false}
      cornerRadius={0}
      elevation={0}
      className="p-4 pt-0"
    >
      <GestureHandlerRootView className="grow">
        <View className="overflow-hidden rounded-xl bg-surface p-4 pt-0">
          <View>
            <View className="mx-auto my-2.5 h-1 w-8 rounded-full bg-surfaceContainerHigh" />
            {header}
          </View>

          {children}
        </View>
      </GestureHandlerRootView>
    </WrappedSheet>
  );
}

function useSheetComponents(children: React.ReactNode) {
  const listRef = useAnimatedRef();
  return useMemo(() => {
    const nodes: React.JSX.Element[] = Array.isArray(children)
      ? children
      : // `flat(1)` is to handle fragments.
        React.Children.toArray(children).flat(1);

    const header = nodes.find((n) => n.type === Header);
    const contentNodes = nodes.filter((n) => n.type !== Header);

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
          // @ts-expect-error - Ref should still work.
          <ScrollView ref={listRef} contentContainerClassName="-mb-4 pb-4">
            {contentNodes}
          </ScrollView>
        ),
      };
    }
  }, [children, listRef]);
}
//#endregion

//#region Header
export function Header(props: {
  label: string;
  children?: React.ReactNode;
  Leading?: React.ReactNode;
  Trailing?: React.ReactNode;
}) {
  return (
    <View>
      <View className="mb-4 flex-row items-center gap-2">
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
/** If rendered, will be the only child rendered by the sheet. */
export function List<TData>(props: LegendListProps<TData>) {
  return <LegendList {...props} />;
}
//#endregion
