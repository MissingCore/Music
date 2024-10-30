import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import type { SheetProps } from "react-native-actions-sheet";

import {
  OrderedByOptions,
  useSessionPreferencesStore,
} from "@/services/SessionPreferences";

import { Button, Radio, Switch } from "@/components/new/Form";
import { Sheet } from "@/components/new/Sheet";
import { StyledText } from "@/components/new/Typography";

/** Sheet allowing us visually change the sort order on the `/track` screen. */
export default function TrackSortSheet(props: SheetProps<"track-sort-sheet">) {
  const { t } = useTranslation();
  const isAsc = useSessionPreferencesStore((state) => state.isAsc);
  const toggleIsAsc = useSessionPreferencesStore((state) => state.toggleIsAsc);
  const orderedBy = useSessionPreferencesStore((state) => state.orderedBy);
  const setOrderedBy = useSessionPreferencesStore(
    (state) => state.setOrderedBy,
  );

  return (
    <Sheet
      id={props.sheetId}
      title={t("title.sort")}
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
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-1"
      />
    </Sheet>
  );
}
