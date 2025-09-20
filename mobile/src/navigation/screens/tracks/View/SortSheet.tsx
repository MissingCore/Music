import {
  OrderedByOptions,
  useSortPreferencesStore,
} from "~/modules/media/services/SortPreferences";

import { ListItem } from "~/components/Containment/List";
import { FlatList } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import type { TrueSheetRef } from "~/components/Sheet";
import { Sheet } from "~/components/Sheet";
import { TStyledText } from "~/components/Typography/StyledText";

/** Enables us to visually change the sort order on the `/track` screen. */
export function TrackSortSheet(props: { sheetRef: TrueSheetRef }) {
  const isAsc = useSortPreferencesStore((state) => state.isAsc);
  const toggleIsAsc = useSortPreferencesStore((state) => state.toggleIsAsc);
  const orderedBy = useSortPreferencesStore((state) => state.orderedBy);
  const setOrderedBy = useSortPreferencesStore((state) => state.setOrderedBy);

  return (
    <Sheet
      ref={props.sheetRef}
      titleKey="feat.modalSort.title"
      contentContainerClassName="gap-4"
    >
      <ListItem
        titleKey="feat.modalSort.extra.asc"
        onPress={toggleIsAsc}
        switchState={isAsc}
        largeTitle
        first
        last
      />
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
}
