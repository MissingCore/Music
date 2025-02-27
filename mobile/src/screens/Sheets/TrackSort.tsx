import {
  OrderedByOptions,
  useSortPreferencesStore,
} from "~/modules/media/services/SortPreferences";

import { ListItem } from "~/components/Containment/List";
import { FlatList } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import { Sheet } from "~/components/Sheet";
import { TStyledText } from "~/components/Typography/StyledText";

/** Sheet allowing us visually change the sort order on the `/track` screen. */
export default function TrackSortSheet() {
  const isAsc = useSortPreferencesStore((state) => state.isAsc);
  const toggleIsAsc = useSortPreferencesStore((state) => state.toggleIsAsc);
  const orderedBy = useSortPreferencesStore((state) => state.orderedBy);
  const setOrderedBy = useSortPreferencesStore((state) => state.setOrderedBy);

  return (
    <Sheet
      id="TrackSortSheet"
      titleKey="feat.modalSort.title"
      contentContainerClassName="gap-4"
    >
      <ListItem
        titleKey="feat.modalSort.extra.asc"
        onPress={toggleIsAsc}
        switchState={isAsc}
        {...{ largeTitle: true, first: true, last: true }}
      />
      <FlatList
        accessibilityRole="radiogroup"
        data={OrderedByOptions}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Radio
            selected={item === orderedBy}
            onSelect={() => setOrderedBy(item)}
          >
            <TStyledText textKey={`feat.modalSort.extra.${item}`} />
          </Radio>
        )}
        contentContainerClassName="gap-1"
      />
    </Sheet>
  );
}
