import { Pressable } from "react-native";

import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import {
  ViewPreferenceSetters,
  ViewPreferenceTogglers,
} from "~/stores/ViewPreference/actions";

import { FlatList } from "~/components/Defaults";
import { RadioField } from "~/components/Form/Radio";
import { DetachedSheet } from "~/components/Sheet/Detached";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { TStyledText } from "~/components/Typography/StyledText";
import { Switch } from "~/components/UI/Switch";
import {
  SortOptions,
  SortOptionTranslation,
} from "~/stores/ViewPreference/constants";
import type { MutableOrder } from "~/stores/ViewPreference/types";

export function SortSheet(props: { ref: TrueSheetRef; screen: MutableOrder }) {
  const isAsc = useViewPreferenceStore((s) => s[`${props.screen}IsAsc`]);
  const orderedBy = useViewPreferenceStore((s) => s[`${props.screen}Order`]);

  return (
    <DetachedSheet ref={props.ref}>
      <Pressable
        onPress={() => ViewPreferenceTogglers.toggleIsAsc(props.screen)}
        className="flex-row items-center justify-between gap-4 rounded-md bg-surfaceContainerLowest p-4 active:bg-surfaceContainerLow"
      >
        <TStyledText textKey="feat.modalViewPreference.extra.asc" />
        <Switch enabled={isAsc} />
      </Pressable>
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
