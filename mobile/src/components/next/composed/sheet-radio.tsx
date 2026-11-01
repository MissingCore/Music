// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { Button } from "../base/button";
import type { SheetRef } from "../base/sheet";
import { Sheet, SheetLegendList } from "../base/sheet";
import { Text } from "../base/typography";

interface SheetRadioListProps<TData extends { label: string }> {
  data: TData[];
  onSelect: (item: TData) => void;
  isSelected: (item: TData) => boolean;
}

/** Radio list built for sheets. */
export function SheetRadioList<TData extends { label: string }>(
  props: SheetRadioListProps<TData>,
) {
  return (
    <SheetLegendList
      role="radiogroup"
      estimatedItemSize={54} // 48px Height + 6px Margin Bottom
      data={props.data}
      keyExtractor={(item) => item.label}
      extraData={props.isSelected}
      renderItem={({ item }) => {
        const isSelected = props.isSelected(item);
        return (
          <Button
            role="radio"
            aria-checked={isSelected}
            onPress={() => props.onSelect(item)}
            disabled={isSelected}
            filled={isSelected}
            className="rounded-lg py-2 disabled:opacity-100"
          >
            <Text size="lg">{item.label}</Text>
          </Button>
        );
      }}
      contentContainerClassName="gap-1.5"
    />
  );
}

interface RadioSheetProps<
  TData extends { label: string },
> extends SheetRadioListProps<TData> {
  ref: SheetRef;
}

export function RadioSheet<TData extends { label: string }>({
  ref,
  onSelect,
  ...props
}: RadioSheetProps<TData>) {
  return (
    <Sheet ref={ref}>
      <SheetRadioList
        {...props}
        onSelect={(item) => {
          onSelect(item);
          ref.current?.dismiss();
        }}
      />
    </Sheet>
  );
}
