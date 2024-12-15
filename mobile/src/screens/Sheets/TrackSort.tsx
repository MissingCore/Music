import { useTranslation } from "react-i18next";

import {
  OrderedByOptions,
  useSortPreferencesStore,
} from "@/modules/media/services/SortPreferences";

import { FlatList } from "@/components/Defaults";
import { Button, Radio, Switch } from "@/components/Form";
import { Sheet } from "@/components/Sheet";
import { StyledText } from "@/components/Typography";

/** Sheet allowing us visually change the sort order on the `/track` screen. */
export default function TrackSortSheet() {
  const { t } = useTranslation();
  const isAsc = useSortPreferencesStore((state) => state.isAsc);
  const toggleIsAsc = useSortPreferencesStore((state) => state.toggleIsAsc);
  const orderedBy = useSortPreferencesStore((state) => state.orderedBy);
  const setOrderedBy = useSortPreferencesStore((state) => state.setOrderedBy);

  return (
    <Sheet
      id="TrackSortSheet"
      titleKey="title.sort"
      contentContainerClassName="gap-4"
    >
      <Button onPress={toggleIsAsc} className="flex-row justify-between">
        <StyledText className="shrink">{t("sortModal.asc")}</StyledText>
        <Switch enabled={isAsc} />
      </Button>
      <FlatList
        data={OrderedByOptions}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Radio
            selected={item === orderedBy}
            onSelect={() => setOrderedBy(item)}
          >
            <StyledText>{t(`sortModal.${item}`)}</StyledText>
          </Radio>
        )}
        contentContainerClassName="gap-1"
      />
    </Sheet>
  );
}
