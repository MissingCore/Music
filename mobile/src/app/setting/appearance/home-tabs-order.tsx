import { memo, useCallback, useEffect, useState } from "react";
import { Pressable } from "react-native";
import type { DragListRenderItemInfo } from "react-native-draglist";
import DragList from "react-native-draglist";

import { DragIndicator } from "@/icons/DragIndicator";
import type { OrderableTabs } from "@/services/UserPreferences";
import { useUserPreferencesStore } from "@/services/UserPreferences";
import { StandardScrollLayout } from "@/layouts/StandardScroll";

import { cn } from "@/lib/style";
import { moveArray, pickKeys } from "@/utils/object";
import { useListPresets } from "@/components/Defaults";
import { Divider } from "@/components/Divider";
import { TStyledText } from "@/components/Typography/StyledText";

type TabValues = (typeof OrderableTabs)[number];

/** Screen for `/setting/appearance/home-tabs-order` route. */
export default function HomeTabsOrderScreen() {
  const listPresets = useListPresets();
  const [tabOrder, setTabOrder] = useState<TabValues[]>([]);
  const homeTabsOrder = useUserPreferencesStore((state) => state.homeTabsOrder);
  const moveTab = useUserPreferencesStore((state) => state.moveTab);

  const renderItem = useCallback(
    (args: RenderItemProps) => <RenderItem {...args} />,
    [],
  );

  const onReordered = useCallback(
    async (fromIndex: number, toIndex: number) => {
      setTabOrder((prev) => moveArray(prev, { fromIndex, toIndex }));
      moveTab(fromIndex, toIndex);
    },
    [moveTab],
  );

  // Synchronize the local and real state.
  useEffect(() => {
    setTabOrder(homeTabsOrder);
  }, [homeTabsOrder]);

  return (
    <StandardScrollLayout>
      <TStyledText
        textKey="settings.description.homeTabsOrder"
        dim
        className="text-center text-sm"
      />
      <Divider />
      <DragList
        estimatedItemSize={52} // 48px Height + 4px Margin top
        data={tabOrder}
        keyExtractor={(tabKey) => tabKey}
        renderItem={renderItem}
        onReordered={onReordered}
        {...listPresets}
      />
    </StandardScrollLayout>
  );
}

/** Items rendered in the `<DragList />`. */
type RenderItemProps = DragListRenderItemInfo<TabValues>;

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
      className={cn(
        "min-h-12 flex-row items-center gap-2 rounded-md p-4 pl-2 active:bg-surface/50",
        {
          "opacity-25": !info.isActive && info.isDragging,
          "!bg-surface": info.isActive,
          "mt-1": info.index > 0,
        },
      )}
    >
      <DragIndicator />
      <TStyledText textKey={`common.${item}s`} className="pl-2" />
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
