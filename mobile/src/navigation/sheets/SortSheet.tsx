// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import {
  ViewPreferenceSetters,
  ViewPreferenceTogglers,
} from "~/stores/ViewPreference/actions";

import { FlatList } from "~/components/Base/List";
import { RadioField } from "~/components/Form/Radio";
import { SegmentedList } from "~/components/List/Segmented";
import { DetachedSheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { TStyledText } from "~/components/Typography/StyledText";
import { Switch } from "~/components/UI/Switch";
import {
  SortOptions,
  SortOptionTranslation,
} from "~/stores/ViewPreference/constants";
import type { MutableViewOrder } from "~/stores/ViewPreference/types";

export function SortSheet(props: {
  ref: TrueSheetRef;
  screen: MutableViewOrder;
}) {
  const isAsc = useViewPreferenceStore((s) => s[`${props.screen}IsAsc`]);
  const orderedBy = useViewPreferenceStore((s) => s[`${props.screen}Order`]);

  return (
    <DetachedSheet ref={props.ref}>
      <SegmentedList.Item
        labelText="feat.modalViewPreference.extra.asc"
        onPress={() => ViewPreferenceTogglers.toggleIsAsc(props.screen)}
        Trailing={<Switch enabled={isAsc} />}
        _labelTextClassName="text-base"
      />
      <FlatList
        accessibilityRole="radiogroup"
        data={SortOptions[props.screen]}
        keyExtractor={(sortOption) => sortOption}
        renderItem={({ item: sortOption }) => (
          <RadioField
            selected={orderedBy === sortOption}
            onSelect={() =>
              ViewPreferenceSetters.setSortOrder(props.screen, sortOption)
            }
          >
            <TStyledText textKey={SortOptionTranslation[sortOption]} />
          </RadioField>
        )}
        contentContainerClassName="gap-2"
      />
    </DetachedSheet>
  );
}
