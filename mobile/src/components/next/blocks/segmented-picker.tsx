// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { cn } from "~/lib/style";
import { isString } from "~/utils/validation";
import { FlatList } from "~/components/Base/List";
import type { SupportedIconName } from "../base/icon";
import { Icon } from "../base/icon";
import { Ripple } from "../base/ripple";
import { Text } from "../base/typography";

type PickerOption<TData extends string> = { label: string; value: TData };

type SegmentedPickerType = "radio" | "checkbox";

type SegmentedPickerProps<TData extends string> = {
  options: Array<PickerOption<TData>>;
  onSelect: (value: TData) => void;
  accessibilityLabel?: string;
} & (
  | { type: "radio"; selected: TData; reselect?: never }
  | {
      type: "radio";
      selected: TData;
      reselect: { cb: VoidFunction; icon: SupportedIconName };
    }
  | { type: "checkbox"; selected: TData[]; reselect?: never }
);

const AccessibilityOptions = {
  checkbox: {
    groupRole: "group",
    itemAttributes: (selected: boolean) =>
      ({ role: "checkbox", "aria-checked": selected }) as const,
  },
  radio: {
    groupRole: "radiogroup",
    itemAttributes: (selected: boolean) =>
      ({ role: "radio", "aria-selected": selected }) as const,
  },
} as const satisfies Record<SegmentedPickerType, any>;

export function SegmentedPicker<TData extends string>({
  type,
  options,
  selected,
  onSelect,
  reselect,
  accessibilityLabel,
}: SegmentedPickerProps<TData>) {
  const accessOpts = AccessibilityOptions[type];
  return (
    <FlatList
      accessibilityLabel={accessibilityLabel}
      role={accessOpts.groupRole}
      numColumns={reselect ? 2 : options.length}
      data={options}
      keyExtractor={({ value }) => value}
      renderItem={({ item: { label, value } }) => {
        const isSelected = isString(selected)
          ? selected === value
          : selected.includes(value);
        const isActiveRadio = type === "radio" && isSelected;
        return (
          <Ripple
            {...accessOpts.itemAttributes(isSelected)}
            onPress={() => (isActiveRadio ? reselect?.cb() : onSelect(value))}
            disabled={isActiveRadio && !reselect}
            className={cn(
              "min-h-10 flex-1 flex-row items-center justify-center gap-2 rounded-sm p-2",
              isSelected && "bg-surfaceContainerHigh",
              reselect && "justify-between",
            )}
          >
            <Text numberOfLines={1} size="sm" center className="shrink">
              {label}
            </Text>
            {reselect ? (
              <View className="size-5 shrink-0">
                {isActiveRadio && <Icon name={reselect.icon} size={20} />}
              </View>
            ) : null}
          </Ripple>
        );
      }}
      columnWrapperClassName="gap-1"
      contentContainerClassName="gap-1 rounded-md bg-surfaceContainerLowest p-1"
    />
  );
}
