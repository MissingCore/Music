import { Pressable } from "react-native";

import {
  OrderedByOptions,
  useSortPreferencesStore,
} from "~/modules/media/services/SortPreferences";

import { FlatList } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import { Switch } from "~/components/Form/Switch";
import { Sheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { TStyledText } from "~/components/Typography/StyledText";
import { deferInitialRender } from "../../../components/DeferredRender";

/** Enables us to visually change the sort order on the `/track` screen. */
export const TrackSortSheet = deferInitialRender(
  function TrackSortSheet(props: { ref: TrueSheetRef }) {
    const isAsc = useSortPreferencesStore((s) => s.isAsc);
    const toggleIsAsc = useSortPreferencesStore((s) => s.toggleIsAsc);
    const orderedBy = useSortPreferencesStore((s) => s.orderedBy);
    const setOrderedBy = useSortPreferencesStore((s) => s.setOrderedBy);

    return (
      <Sheet
        ref={props.ref}
        titleKey="feat.modalSort.title"
        contentContainerClassName="gap-4"
      >
        <Pressable
          onPress={toggleIsAsc}
          className="flex-row items-center justify-between gap-4 rounded-md bg-surface p-4 active:opacity-75"
        >
          <TStyledText textKey="feat.modalSort.extra.asc" />
          <Switch enabled={isAsc} />
        </Pressable>
        <FlatList
          accessibilityRole="radiogroup"
          data={OrderedByOptions}
          keyExtractor={(sortOption) => sortOption}
          renderItem={({ item: sortOption }) => (
            <Radio
              selected={orderedBy === sortOption}
              onSelect={() => setOrderedBy(sortOption)}
            >
              <TStyledText textKey={`feat.modalSort.extra.${sortOption}`} />
            </Radio>
          )}
          contentContainerClassName="gap-1"
        />
      </Sheet>
    );
  },
);
