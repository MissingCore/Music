import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { DragIndicator } from "~/resources/icons/DragIndicator";
import { Home } from "~/resources/icons/Home";
import { Visibility } from "~/resources/icons/Visibility";
import { VisibilityOff } from "~/resources/icons/VisibilityOff";
import { usePreferenceStore } from "~/stores/Preference/store";
import { Tabs } from "~/stores/Preference/actions";

import { cn } from "~/lib/style";
import { IconButton } from "~/components/Form/Button/Icon";
import { DetachedSheet } from "~/components/Sheet/Detached";
import type { SheetDragListRenderItemInfo } from "~/components/Sheet/SheetDragList";
import { SheetDragList } from "~/components/Sheet/SheetDragList";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { TStyledText } from "~/components/Typography/StyledText";
import type { Tab } from "~/stores/Preference/types";

type RenderItemProps = SheetDragListRenderItemInfo<Tab>;

export function TabOrderSheet(props: { ref: TrueSheetRef }) {
  const data = usePreferenceStore((s) => s.tabsOrder);
  const [draggable, setDraggable] = useState(true);

  return (
    <DetachedSheet
      ref={props.ref}
      titleKey="feat.tabsOrder.title"
      draggable={draggable}
    >
      <SheetDragList
        data={data}
        keyExtractor={(tabKey) => tabKey}
        estimatedItemSize={64}
        renderItem={(args) => <RenderItem {...args} />}
        onDragBegin={() => setDraggable(false)}
        onDragEnd={() => setDraggable(true)}
        onReordered={Tabs.move}
        style={{ height: 376 }}
        contentContainerStyle={{ gap: 8 }}
      />
    </DetachedSheet>
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
      <View
        collapsable={false}
        className={cn("h-14 flex-row items-center rounded-md", {
          "opacity-25": !info.active && info.isDragging,
          "bg-surface!": info.active,
        })}
      >
        <IconButton
          Icon={DragIndicator}
          accessibilityLabel=""
          onPressIn={info.onInitDrag}
        />
        <TStyledText
          textKey={tabNameKey}
          numberOfLines={1}
          className="shrink grow p-4 pr-2"
        />
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
      </View>
    );
  },
  (oldProps, newProps) => {
    return (
      oldProps.item === newProps.item &&
      (["index", "active", "isDragging"] as const).every(
        (k) => oldProps[k] === newProps[k],
      )
    );
  },
);
