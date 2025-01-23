import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import type { DragListRenderItemInfo } from "react-native-draglist/dist/FlashList";

import { DragIndicator } from "@/icons/DragIndicator";
import { Eye } from "@/icons/Eye";
import { EyeOff } from "@/icons/EyeOff";
import type { OrderableTab } from "@/services/UserPreferences";
import { useUserPreferencesStore } from "@/services/UserPreferences";
import { StandardScrollLayout } from "@/layouts/StandardScroll";
import {
  areRenderItemPropsEqual,
  useDragListState,
} from "@/lib/react-native-draglist";

import { cn } from "@/lib/style";
import { FlashDragList } from "@/components/Defaults";
import { Divider } from "@/components/Divider";
import { IconButton } from "@/components/Form/Button";
import { TStyledText } from "@/components/Typography/StyledText";

type RenderItemProps = DragListRenderItemInfo<OrderableTab>;

/** Screen for `/setting/appearance/home-tabs-order` route. */
export default function HomeTabsOrderScreen() {
  const data = useUserPreferencesStore((state) => state.tabsOrder);
  const onMove = useUserPreferencesStore((state) => state.moveTab);
  const { items, onReordered } = useDragListState({ data, onMove });

  const renderItem = useCallback(
    (args: RenderItemProps) => <RenderItem {...args} />,
    [],
  );

  return (
    <StandardScrollLayout>
      <TStyledText
        textKey="settings.description.homeTabsOrder"
        dim
        className="text-center text-sm"
      />
      <Divider />
      <FlashDragList
        estimatedItemSize={52} // 48px Height + 4px Margin top
        data={items}
        keyExtractor={(tabKey) => tabKey}
        renderItem={renderItem}
        onReordered={onReordered}
      />
    </StandardScrollLayout>
  );
}

/** Item rendered in the `<DragList />`. */
const RenderItem = memo(
  function RenderItem({ item, ...info }: RenderItemProps) {
    const { t } = useTranslation();
    const tabsVisibility = useUserPreferencesStore(
      (state) => state.tabsVisibility,
    );
    const toggleVisibility = useUserPreferencesStore(
      (state) => state.toggleTabVisibility,
    );

    const isVisible = tabsVisibility[item];
    const Icon = isVisible ? Eye : EyeOff;
    const tabNameKey = `common.${item}s` as const;

    return (
      <Pressable
        onPressIn={info.onDragStart}
        onPressOut={info.onDragEnd}
        className={cn(
          "min-h-12 flex-row items-center rounded-md pl-2 active:bg-surface/50",
          {
            "opacity-25": !info.isActive && info.isDragging,
            "!bg-surface": info.isActive,
            "mt-1": info.index > 0,
          },
        )}
      >
        <DragIndicator />
        <TStyledText textKey={tabNameKey} className="shrink grow p-4 pr-2" />
        <IconButton
          kind="ripple"
          accessibilityLabel={t(
            isVisible ? "template.hideEntry" : "template.showEntry",
            { name: t(tabNameKey) },
          )}
          onPress={() => toggleVisibility(item)}
          disabled={info.isDragging}
        >
          <Icon />
        </IconButton>
      </Pressable>
    );
  },
  areRenderItemPropsEqual((o, n) => o.item === n.item),
);
