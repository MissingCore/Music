import { memo, useCallback } from "react";
import { Pressable, View } from "react-native";
import type { DragListRenderItemInfo } from "react-native-draglist";
import DragList from "react-native-draglist";

import type { OrderableTabs } from "@/services/UserPreferences";
import { useUserPreferencesStore } from "@/services/UserPreferences";

import { cn } from "@/lib/style";
import { pickKeys } from "@/utils/object";
import { useListPresets } from "@/components/Defaults";
import { TStyledText } from "@/components/Typography/StyledText";

/** Screen for `/setting/appearance/home-tabs-order` route. */
export default function HomeTabsOrderScreen() {
  const listPresets = useListPresets();
  const homeTabsOrder = useUserPreferencesStore((state) => state.homeTabsOrder);
  const moveTab = useUserPreferencesStore((state) => state.moveTab);

  const renderItem = useCallback(
    (args: RenderItemProps) => <RenderItem {...args} />,
    [],
  );

  return (
    <View className="grow gap-6 p-4">
      <TStyledText
        textKey="settings.description.homeTabsOrder"
        dim
        className="text-center text-sm"
      />
      <DragList
        estimatedItemSize={52} // 48px Height + 4px Margin top
        data={homeTabsOrder}
        keyExtractor={(tabKey) => tabKey}
        renderItem={renderItem}
        onReordered={moveTab}
        {...listPresets}
      />
    </View>
  );
}

/** Items rendered in the `<DragList />`. */
type RenderItemProps = DragListRenderItemInfo<(typeof OrderableTabs)[number]>;

/** Item rendered in the `<DragList />`. */
const RenderItem = memo(function RenderItem({
  item,
  ...info
}: RenderItemProps) {
  return (
    <Pressable
      delayLongPress={100}
      onLongPress={info.onDragStart}
      onPressOut={info.onDragEnd}
      className={cn("min-h-12 rounded-md p-4 active:bg-surface/50", {
        "!bg-surface": info.isActive,
        "mt-1": info.index > 0,
      })}
    >
      <TStyledText textKey={`common.${item}s`} />
    </Pressable>
  );
}, areRenderItemPropsEqual);

const RenderItemPrimitiveProps = ["index", "isActive", "isDragging"] as const;

function areRenderItemPropsEqual(
  oldProps: RenderItemProps,
  newProps: RenderItemProps,
) {
  const primitiveProps = pickKeys(oldProps, RenderItemPrimitiveProps);
  return (
    oldProps.item === newProps.item &&
    Object.entries(primitiveProps).every(
      // @ts-expect-error - Non-existent type conflicts.
      ([key, value]) => value === newProps[key],
    )
  );
}
