import { View } from "react-native";

import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { LANGUAGES } from "~/modules/i18n/constants";
import { useExportBackup, useImportBackup } from "./helpers/BackupData";

import { mutateGuard } from "~/lib/react-query";
import { FlatList } from "~/components/Defaults/Legacy";
import { Button } from "~/components/Form/Button";
import { Radio } from "~/components/Form/Selection";
import type { TrueSheetRef } from "~/components/Sheet";
import { Sheet } from "~/components/Sheet";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

/** All the sheets used on `/setting` route. */
export function SettingsSheets(
  props: Record<"backupRef" | "languageRef", TrueSheetRef>,
) {
  return (
    <>
      <BackupSheet sheetRef={props.backupRef} />
      <LanguageSheet sheetRef={props.languageRef} />
    </>
  );
}

/** Enables import & export of a backup of your media organization in this app. */
function BackupSheet(props: { sheetRef: TrueSheetRef }) {
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();

  const inProgress = exportBackup.isPending || importBackup.isPending;

  return (
    <Sheet
      ref={props.sheetRef}
      titleKey="feat.backup.title"
      contentContainerClassName="gap-4"
    >
      <TStyledText
        dim
        textKey="feat.backup.description"
        className="text-center text-sm"
      />

      <View className="mt-2 flex-row gap-2">
        <Button
          onPress={() => mutateGuard(exportBackup, undefined)}
          disabled={inProgress}
          className="flex-1"
        >
          <TStyledText
            textKey="feat.backup.extra.export"
            bold
            className="text-center text-sm"
          />
        </Button>
        <Button
          onPress={() => mutateGuard(importBackup, undefined)}
          disabled={inProgress}
          className="flex-1"
        >
          <TStyledText
            textKey="feat.backup.extra.import"
            bold
            className="text-center text-sm"
          />
        </Button>
      </View>
    </Sheet>
  );
}

/** Enables the ability to change the language used. */
function LanguageSheet(props: { sheetRef: TrueSheetRef }) {
  const languageCode = useUserPreferencesStore((state) => state.language);
  return (
    <Sheet
      ref={props.sheetRef}
      titleKey="feat.language.title"
      contentContainerClassName="pb-0"
    >
      <FlatList
        accessibilityRole="radiogroup"
        data={LANGUAGES}
        keyExtractor={({ code }) => code}
        renderItem={({ item }) => (
          <Radio
            selected={item.code === languageCode}
            onSelect={() => setLanguage(item.code)}
          >
            <StyledText>{item.name}</StyledText>
          </Radio>
        )}
        nestedScrollEnabled
        contentContainerClassName="gap-1 pb-4"
      />
    </Sheet>
  );
}

//#region Setter Functions
const setLanguage = (languageCode: string) =>
  userPreferencesStore.setState({ language: languageCode });
//#endregion
