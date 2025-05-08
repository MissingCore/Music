import type { ActionSheetRef } from "react-native-actions-sheet";
import { View } from "react-native";

import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { LANGUAGES } from "~/modules/i18n/constants";
import { useExportBackup, useImportBackup } from "./helpers/BackupData";

import { mutateGuard } from "~/lib/react-query";
import { SheetsFlashList } from "~/components/Defaults";
import { Button } from "~/components/Form/Button";
import { Radio } from "~/components/Form/Selection";
import { Sheet } from "~/components/Sheet";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

/** All the sheets used on `/setting` route. */
export function SettingsSheets(
  props: Record<"backupRef" | "languageRef", React.RefObject<ActionSheetRef>>,
) {
  return (
    <>
      <BackupSheet sheetRef={props.backupRef} />
      <LanguageSheet sheetRef={props.languageRef} />
    </>
  );
}

/** Enables import & export of a backup of your media organization in this app. */
function BackupSheet(props: { sheetRef: React.RefObject<ActionSheetRef> }) {
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
function LanguageSheet(props: { sheetRef: React.RefObject<ActionSheetRef> }) {
  const languageCode = useUserPreferencesStore((state) => state.language);
  return (
    <Sheet ref={props.sheetRef} titleKey="feat.language.title" snapTop>
      <SheetsFlashList
        estimatedItemSize={58} // 54px Height + 4px Margin Top
        accessibilityRole="radiogroup"
        data={LANGUAGES}
        keyExtractor={({ code }) => code}
        extraData={languageCode}
        renderItem={({ item, index }) => (
          <Radio
            selected={languageCode === item.code}
            onSelect={() => setLanguage(item.code)}
            wrapperClassName={index > 0 ? "mt-1" : undefined}
          >
            <StyledText>{item.name}</StyledText>
          </Radio>
        )}
        contentContainerClassName="pb-4"
      />
    </Sheet>
  );
}

//#region Setter Functions
const setLanguage = (languageCode: string) =>
  userPreferencesStore.setState({ language: languageCode });
//#endregion
