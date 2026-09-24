// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { cn } from "~/lib/style";
import { isString } from "~/utils/validation";
import { FlatList } from "~/components/Base/List";
import { Ripple } from "../base/ripple";
import { Text } from "../base/typography";

type PickerOption<TData extends string> = { label: string; value: TData };

type SegmentedPickerType = "radio" | "checkbox";

type SegmentedPickerProps<TData extends string> = {
  options: Array<PickerOption<TData>>;
  onSelected: (value: TData) => void;
  accessibilityLabel?: string;
} & (
  { type: "radio"; selected: TData } | { type: "checkbox"; selected: TData[] }
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
  onSelected,
  accessibilityLabel,
}: SegmentedPickerProps<TData>) {
  const accessOpts = AccessibilityOptions[type];
  return (
    <FlatList
      accessibilityLabel={accessibilityLabel}
      role={accessOpts.groupRole}
      numColumns={options.length}
      data={options}
      keyExtractor={({ value }) => value}
      renderItem={({ item: { label, value } }) => {
        const isSelected = isString(selected)
          ? selected === value
          : selected.includes(value);
        return (
          <Ripple
            {...accessOpts.itemAttributes(isSelected)}
            onPress={() => onSelected(value)}
            disabled={type === "radio" && isSelected}
            className={cn(
              "min-h-8 flex-1 items-center justify-center rounded-sm p-1",
              isSelected && "bg-surfaceContainerHigh",
            )}
          >
            <Text numberOfLines={1} size="sm" center>
              {label}
            </Text>
          </Ripple>
        );
      }}
      columnWrapperClassName="gap-1"
      contentContainerClassName="rounded-md bg-surfaceContainerLowest p-1"
    />
  );
}
