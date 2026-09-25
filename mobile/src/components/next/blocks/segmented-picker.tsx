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
  numColumns?: number;
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
  checkbox: { groupRole: "group", itemRole: "checkbox" },
  radio: { groupRole: "radiogroup", itemRole: "radio" },
} as const satisfies Record<SegmentedPickerType, any>;

export function SegmentedPicker<TData extends string>({
  type,
  options,
  selected,
  onSelect,
  reselect,
  accessibilityLabel,
  numColumns,
}: SegmentedPickerProps<TData>) {
  const accessOpts = AccessibilityOptions[type];
  return (
    <FlatList
      accessibilityLabel={accessibilityLabel}
      role={accessOpts.groupRole}
      numColumns={numColumns || (reselect ? 2 : options.length)}
      data={options}
      keyExtractor={({ value }) => value}
      renderItem={({ item: { label, value } }) => {
        const isSelected = isString(selected)
          ? selected === value
          : selected.includes(value);
        const isActiveRadio = type === "radio" && isSelected;
        return (
          <Ripple
            role={accessOpts.itemRole}
            aria-checked={isSelected}
            onPress={() => (isActiveRadio ? reselect?.cb() : onSelect(value))}
            disabled={isActiveRadio && !reselect}
            className={cn(
              "min-h-8 flex-1 flex-row items-center justify-center gap-2 rounded-sm p-1 px-2",
              isSelected && "bg-surfaceContainerHigh",
              reselect && "min-h-10 justify-between p-2",
            )}
          >
            <Text numberOfLines={1} size="sm" center className="shrink">
              {label}
            </Text>
            {reselect && isActiveRadio ? (
              <View className="size-5 shrink-0">
                <Icon name={reselect.icon} size={20} />
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
