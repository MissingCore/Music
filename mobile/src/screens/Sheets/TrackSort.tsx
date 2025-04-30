import {
  OrderedByOptions,
  useSortPreferencesStore,
} from "~/modules/media/services/SortPreferences";

import { deferInitialRender } from "~/lib/react";
import { ListItem } from "~/components/Containment/List";
import { LegendList } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import type { TrueSheetRef } from "~/components/Sheet";
import { Sheet } from "~/components/Sheet";
import { TStyledText } from "~/components/Typography/StyledText";

/** Enables us to visually change the sort order on the `/track` screen. */
export const TrackSortSheet = deferInitialRender(
  function TrackSortSheet(props: { sheetRef: TrueSheetRef }) {
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
          {...{ largeTitle: true, first: true, last: true }}
        />
        <LegendList
          accessibilityRole="radiogroup"
          estimatedItemSize={54}
          data={OrderedByOptions}
          keyExtractor={(sortOption) => sortOption}
          extraData={orderedBy}
          renderItem={({ item: sortOption }) => (
            <Radio
              selected={orderedBy === sortOption}
              onSelect={() => setOrderedBy(sortOption)}
            >
              <TStyledText textKey={`feat.modalSort.extra.${sortOption}`} />
            </Radio>
          )}
          columnWrapperStyle={{ rowGap: 4 }}
        />
      </Sheet>
    );
  },
);
