import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { LANGUAGES } from "~/modules/i18n/constants";
import { useExportBackup, useImportBackup } from "./utils";

import { deferInitialRender } from "~/lib/react";
import { mutateGuard } from "~/lib/react-query";
import { FlatList, useIsScrollable } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import type { TrueSheetRef } from "~/components/Sheet";
import { Sheet, SheetButtonGroup } from "~/components/Sheet";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

/** All the sheets used on `/setting` route. */
export const SettingsSheets = deferInitialRender(function SettingsSheets(
  props: Record<"backupRef" | "languageRef", TrueSheetRef>,
) {
  return (
    <>
      <BackupSheet sheetRef={props.backupRef} />
      <LanguageSheet sheetRef={props.languageRef} />
    </>
  );
});

/** Enables import & export of a backup of your media organization in this app. */
function BackupSheet(props: { sheetRef: TrueSheetRef }) {
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();

  const inProgress = exportBackup.isPending || importBackup.isPending;

  return (
    <Sheet ref={props.sheetRef} titleKey="feat.backup.title">
      <TStyledText
        dim
        textKey="feat.backup.description"
        className="text-center text-sm"
      />
      <SheetButtonGroup
        leftButton={{
          textKey: "feat.backup.extra.export",
          onPress: () => mutateGuard(exportBackup, undefined),
          disabled: inProgress,
        }}
        rightButton={{
          textKey: "feat.backup.extra.import",
          onPress: () => mutateGuard(importBackup, undefined),
          disabled: inProgress,
        }}
      />
    </Sheet>
  );
}

/** Enables the ability to change the language used. */
function LanguageSheet(props: { sheetRef: TrueSheetRef }) {
  const languageCode = useUserPreferencesStore((state) => state.language);
  const { handlers, isScrollable } = useIsScrollable();

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
            selected={languageCode === item.code}
            onSelect={() => setLanguage(item.code)}
          >
            <StyledText>{item.name}</StyledText>
          </Radio>
        )}
        {...handlers}
        nestedScrollEnabled={isScrollable}
        contentContainerClassName="gap-1 pb-4"
      />
    </Sheet>
  );
}

//#region Setter Functions
const setLanguage = (languageCode: string) =>
  userPreferencesStore.setState({ language: languageCode });
//#endregion
