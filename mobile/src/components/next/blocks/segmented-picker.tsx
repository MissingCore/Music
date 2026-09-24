// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { cn } from "~/lib/style";
import { Ripple } from "../base/ripple";
import { Text } from "../base/typography";

type PickerOption<TData> = { label: string; value: TData; selected: boolean };

type SegmentedPickerType = "radio" | "checkbox";

interface SegmentedPickerProps<TData> {
  type: SegmentedPickerType;
  /** It's recommendated to show up to 3 items. */
  options: Array<PickerOption<TData>>;
  onSelected: (value: TData) => void;
  accessibilityLabel?: string;
}

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

export function SegmentedPicker<TData>({
  type,
  options,
  onSelected,
  accessibilityLabel,
}: SegmentedPickerProps<TData>) {
  const accessOpts = AccessibilityOptions[type];
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      role={accessOpts.groupRole}
      className="flex-row items-center gap-1 rounded-md bg-surfaceContainerLowest p-1"
    >
      {options.map((option, idx) => (
        <Ripple
          key={idx}
          {...accessOpts.itemAttributes(option.selected)}
          onPress={() => onSelected(option.value)}
          disabled={type === "radio" && option.selected}
          className={cn(
            "min-h-8 flex-1 items-center justify-center rounded-sm p-1",
            option.selected && "bg-surfaceContainerHigh",
          )}
        >
          <Text numberOfLines={1} size="sm" center>
            {option.label}
          </Text>
        </Ripple>
      ))}
    </View>
  );
}
