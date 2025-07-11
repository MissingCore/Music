import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import type { DragListRenderItemInfo } from "react-native-draglist/dist/FlashList";

import { DragIndicator } from "~/icons/DragIndicator";
import { Visibility } from "~/icons/Visibility";
import { VisibilityOff } from "~/icons/VisibilityOff";
import type { OrderableTab } from "~/services/UserPreferences";
import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import {
  areRenderItemPropsEqual,
  useDragListState,
} from "~/lib/react-native-draglist";

import { cn } from "~/lib/style";
import { moveArray } from "~/utils/object";
import { FlashDragList } from "~/components/Defaults";
import { Divider } from "~/components/Divider";
import { IconButton } from "~/components/Form/Button";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

type RenderItemProps = DragListRenderItemInfo<OrderableTab>;

/** Screen for `/setting/appearance/home-tabs-order` route. */
export default function HomeTabsOrderScreen() {
  const data = useUserPreferencesStore((state) => state.tabsOrder);
  const { items, onReordered } = useDragListState({ data, onMove });
  return (
    <FlashDragList
      estimatedItemSize={52} // 48px Height + 4px Margin top
      data={items}
      keyExtractor={(tabKey) => tabKey}
      renderItem={(args) => <RenderItem {...args} />}
      onReordered={onReordered}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerClassName="p-4"
    />
  );
}

function ListHeaderComponent() {
  const { t } = useTranslation();
  return (
    <>
      <StyledText dim className="text-center text-sm">
        {t("feat.homeTabsOrder.description.line1")}
        {"\n\n"}
        {t("feat.homeTabsOrder.description.line2")}
      </StyledText>
      <Divider className="my-6" />
    </>
  );
}

/** Item rendered in the `<DragList />`. */
const RenderItem = memo(
  function RenderItem({ item, ...info }: RenderItemProps) {
    const { t } = useTranslation();
    const tabsVisibility = useUserPreferencesStore(
      (state) => state.tabsVisibility,
    );

    const isVisible = tabsVisibility[item];
    const tabNameKey = `term.${item}s` as const;

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
          Icon={isVisible ? Visibility : VisibilityOff}
          accessibilityLabel={t(
            isVisible ? "template.entryHide" : "template.entryShow",
            { name: t(tabNameKey) },
          )}
          onPress={() => toggleTabVisibility(item)}
          disabled={info.isDragging}
        />
      </Pressable>
    );
  },
  areRenderItemPropsEqual((o, n) => o.item === n.item),
);

const onMove = (fromIndex: number, toIndex: number) =>
  userPreferencesStore.setState(({ tabsOrder }) => ({
    tabsOrder: moveArray(tabsOrder, { fromIndex, toIndex }),
  }));

const toggleTabVisibility = (tab: OrderableTab) =>
  userPreferencesStore.setState(({ tabsVisibility }) => ({
    tabsVisibility: { ...tabsVisibility, [tab]: !tabsVisibility[tab] },
  }));
