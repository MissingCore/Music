// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { DragListRenderItemInfo } from "@missingcore/ui/drag-list";
import { DragList, useDragListState } from "@missingcore/ui/drag-list";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";
import { Tabs } from "~/stores/Preference/actions";
import type { Tab } from "~/stores/Preference/types";

import { cn } from "~/lib/style";
import { CheckboxInput } from "~/components/Form/Checkbox";
import { IconButton } from "~/components/next/base/button-icon";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { TText } from "~/components/next/base/typography";

type RenderItemProps = DragListRenderItemInfo<Tab>;

export function TabOrderSheet(props: { ref: SheetRef }) {
  const data = usePreferenceStore((s) => s.tabsOrder);
  const [draggable, setDraggable] = useState(true);

  return (
    <Sheet ref={props.ref} draggable={draggable}>
      <DragList
        CustomList={Sheet.List}
        data={data}
        keyExtractor={(tabKey) => tabKey}
        estimatedItemSize={62}
        renderItem={(args) => <RenderItem {...args} />}
        onDragBegin={() => setDraggable(false)}
        onDragEnd={() => setDraggable(true)}
        onReordered={Tabs.move}
        contentContainerClassName="gap-1.5"
        alwaysKeyRenderedItems
      />
    </Sheet>
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
        <CheckboxInput
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
        <TText
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
