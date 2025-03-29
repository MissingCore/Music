import type { TrueSheet } from "@lodev09/react-native-true-sheet";
import type { RefObject } from "react";
import { forwardRef } from "react";
import { View } from "react-native";

import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { LANGUAGES } from "~/modules/i18n/constants";
import { useExportBackup, useImportBackup } from "./helpers/BackupData";

import { mutateGuard } from "~/lib/react-query";
import { FlatList } from "~/components/Defaults";
import { Button } from "~/components/Form/Button";
import { Radio } from "~/components/Form/Selection";
import { Sheet } from "~/components/New_Sheet";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

/** All the sheets used on `/setting` route. */
export function SettingsSheets(props: {
  backupRef: RefObject<TrueSheet>;
  languageRef: RefObject<TrueSheet>;
}) {
  return (
    <>
      <BackupSheet ref={props.backupRef} />
      <LanguageSheet ref={props.languageRef} />
    </>
  );
}

/** Enables import & export of a backup of your media organization in this app. */
const BackupSheet = forwardRef<TrueSheet>(function BackupSheet(_, ref) {
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();

  const inProgress = exportBackup.isPending || importBackup.isPending;

  return (
    <Sheet
      ref={ref}
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
});

/** Enables the ability to change the language used. */
const LanguageSheet = forwardRef<TrueSheet>(function LanguageSheet(_, ref) {
  const languageCode = useUserPreferencesStore((state) => state.language);
  return (
    <Sheet
      ref={ref}
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
});

const setLanguage = (languageCode: string) =>
  userPreferencesStore.setState({ language: languageCode });
