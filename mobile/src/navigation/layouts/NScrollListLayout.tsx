import type { LegendListProps } from "@legendapp/list";
import { View } from "react-native";
import { useAnimatedScrollHandler } from "react-native-reanimated";

import { usePreferenceStore } from "~/stores/Preference/store";
import { useBottomActionsInset } from "../hooks/useBottomActions";

import {
  AnimatedLegendList,
  useAnimatedLegendListRef,
} from "~/components/Defaults";
import { Scrollbar, useScrollbarContext } from "~/components/NScrollbar";

export function NScrollListLayout<TData>(
  props: Omit<LegendListProps<TData>, "onContentSizeChange" | "onLayout">,
) {
  const bottomInset = useBottomActionsInset();
  const quickScroll = usePreferenceStore((s) => s.quickScroll);
  const internalListRef = useAnimatedLegendListRef();

  const { layoutHandlers, layoutInfo, onScroll } = useScrollbarContext();
  const scrollHandler = useAnimatedScrollHandler({ onScroll });

  return (
    <View className="relative flex-1">
      <AnimatedLegendList
        ref={internalListRef}
        {...layoutHandlers}
        onScroll={scrollHandler}
        maintainVisibleContentPosition={false}
        {...props}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomInset.withNav + 16,
        }}
      />
      <Scrollbar
        listRef={internalListRef}
        scrollbarOffset={{ top: 0, bottom: bottomInset.withNav + 16 }}
        isVisible={quickScroll}
        {...layoutInfo}
      />
    </View>
  );
}
