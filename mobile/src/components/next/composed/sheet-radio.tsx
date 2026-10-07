// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { Button } from "../base/button";
import type { SheetRef } from "../base/sheet";
import { Sheet } from "../base/sheet";
import { Text } from "../base/typography";

interface RadioSheetProps<TData extends { label: string }> {
  ref: SheetRef;
  data: TData[];
  onSelect: (item: TData) => void;
  isSelected: (item: TData) => boolean;
}

export function RadioSheet<TData extends { label: string }>(
  props: RadioSheetProps<TData>,
) {
  return (
    <Sheet ref={props.ref}>
      <Sheet.List
        estimatedItemSize={54} // 48px Height + 6px Margin Bottom
        data={props.data}
        keyExtractor={(item) => item.label}
        renderItem={({ item }) => {
          const isSelected = props.isSelected(item);
          return (
            <Button
              onPress={() => {
                props.onSelect(item);
                props.ref.current?.dismiss();
              }}
              filled={isSelected}
              disabled={isSelected}
              className="mb-1.5 rounded-md py-2 disabled:opacity-100"
            >
              <Text size="lg">{item.label}</Text>
            </Button>
          );
        }}
        className="-mb-5.5"
      />
    </Sheet>
  );
}
