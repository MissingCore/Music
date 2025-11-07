import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import type { DragListRenderItemInfo } from "react-native-draglist/dist/FlashList";

import { DragIndicator } from "~/resources/icons/DragIndicator";
import { Home } from "~/resources/icons/Home";
import { Visibility } from "~/resources/icons/Visibility";
import { VisibilityOff } from "~/resources/icons/VisibilityOff";
import { usePreferenceStore } from "~/stores/Preference/store";
import { Tabs } from "~/stores/Preference/actions";

import { areRenderItemPropsEqual } from "~/lib/react-native-draglist";
import { cn } from "~/lib/style";
import { FlashDragList } from "~/components/Defaults";
import { Divider } from "~/components/Divider";
import { IconButton } from "~/components/Form/Button";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";
import type { Tab } from "~/stores/Preference/types";

type RenderItemProps = DragListRenderItemInfo<Tab>;

export default function HomeTabsOrderSettings() {
  const data = usePreferenceStore((s) => s.tabsOrder);
  return (
    <FlashDragList
      estimatedItemSize={52} // 48px Height + 4px Margin top
      data={data}
      keyExtractor={(tabKey) => tabKey}
      renderItem={(args) => <RenderItem {...args} />}
      onReordered={Tabs.move}
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
        {t("feat.tabsOrder.description.line1")}
        {"\n\n"}
        {t("feat.tabsOrder.description.line2")}
      </StyledText>
      <Divider className="my-6" />
    </>
  );
}

/** Item rendered in the `<DragList />`. */
const RenderItem = memo(
  function RenderItem({ item, ...info }: RenderItemProps) {
    const { t } = useTranslation();
    const homeTab = usePreferenceStore((s) => s.homeTab);
    const tabsVisibility = usePreferenceStore((s) => s.tabsVisibility);

    const isVisible = tabsVisibility[item];
    const isHomeTab = homeTab === item;
    const tabNameKey =
      item === "home" ? "term.home" : (`term.${item}s` as const);

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
          Icon={Home}
          accessibilityLabel={t("feat.tabsOrder.extra.setHomeTab", {
            name: t(tabNameKey),
          })}
          onPress={() => Tabs.setHome(item)}
          disabled={info.isDragging || !isVisible || isHomeTab}
          filled={isHomeTab}
          className={cn({
            "disabled:opacity-100": !info.isDragging && isHomeTab,
          })}
        />
        <IconButton
          Icon={isVisible ? Visibility : VisibilityOff}
          accessibilityLabel={t(
            isVisible ? "template.entryHide" : "template.entryShow",
            { name: t(tabNameKey) },
          )}
          onPress={() => Tabs.toggleVisibility(item)}
          disabled={info.isDragging || isHomeTab}
        />
      </Pressable>
    );
  },
  areRenderItemPropsEqual((o, n) => o.item === n.item),
);
