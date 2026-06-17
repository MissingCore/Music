import type { DragListRenderItemInfo } from "@missingcore/ui/drag-list";
import { DragList, useDragListState } from "@missingcore/ui/drag-list";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";
import { Tabs } from "~/stores/Preference/actions";

import { cn } from "~/lib/style";
import { IconButton } from "~/components/Form/Button/Icon";
import { CheckboxField } from "~/components/Form/Checkbox";
import { DetachedSheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { TStyledText } from "~/components/Typography/StyledText";
import type { Tab } from "~/stores/Preference/types";

type RenderItemProps = DragListRenderItemInfo<Tab>;

export function TabOrderSheet(props: { ref: TrueSheetRef }) {
  const data = usePreferenceStore((s) => s.tabsOrder);
  const [draggable, setDraggable] = useState(true);

  return (
    <DetachedSheet ref={props.ref} draggable={draggable}>
      <DragList
        data={data}
        keyExtractor={(tabKey) => tabKey}
        estimatedItemSize={64}
        renderItem={(args) => <RenderItem {...args} />}
        onDragBegin={() => setDraggable(false)}
        onDragEnd={() => setDraggable(true)}
        onReordered={Tabs.move}
        style={{ height: 440 }}
        contentContainerClassName="gap-2"
        alwaysKeyRenderedItems
      />
    </DetachedSheet>
  );
}

/** Item rendered in the `<DragList />`. */
const RenderItem = memo(
  function RenderItem({ item, index }: RenderItemProps) {
    const { t } = useTranslation();
    const homeTab = usePreferenceStore((s) => s.homeTab);
    const tabsVisibility = usePreferenceStore((s) => s.tabsVisibility);
    const { isActive, isDragging, onInitDrag } = useDragListState(index);

    const isVisible = tabsVisibility[item];
    const isHomeTab = homeTab === item;
    const tabNameKey =
      item === "home" ? "term.home" : (`term.${item}s` as const);
    const tabName = t(tabNameKey);

    return (
      <View
        collapsable={false}
        className={cn("h-14 flex-row items-center rounded-md", {
          "opacity-25": !isActive && isDragging,
          "bg-surfaceContainerLowest!": isActive,
        })}
      >
        <CheckboxField
          accessibilityLabel={t(
            isVisible ? "template.entryHide" : "template.entryShow",
            { name: tabName },
          )}
          checked={isVisible}
          onCheck={() => Tabs.toggleVisibility(item)}
          disabled={isDragging || isHomeTab}
        />
        <IconButton
          icon={`home${isHomeTab ? "-filled" : ""}`}
          accessibilityLabel={t("feat.tabsOrder.extra.setHomeTab", {
            name: tabName,
          })}
          onPress={() => Tabs.setHome(item)}
          disabled={isDragging || !isVisible || isHomeTab}
          className={cn({
            "disabled:opacity-100": !isDragging && isHomeTab,
          })}
          size="md"
        />
        <TStyledText
          textKey={tabNameKey}
          numberOfLines={1}
          className="shrink grow px-2"
        />
        <IconButton
          icon="drag-handle"
          accessibilityLabel={t("template.entryMove", { name: tabName })}
          onPressIn={onInitDrag}
          size="md"
        />
      </View>
    );
  },
  (oldProps, newProps) => {
    return (["item", "index"] as const).every(
      (k) => oldProps[k] === newProps[k],
    );
  },
);
