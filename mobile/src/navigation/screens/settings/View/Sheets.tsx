import { useMemo } from "react";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";
import { LANGUAGES } from "~/modules/i18n/constants";
import { useExportBackup, useImportBackup } from "~/modules/backup/JSON";

import { mutateGuard } from "~/lib/react-query";
import { FlatList } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import type { TrueSheetRef } from "~/components/Sheet";
import {
  Sheet,
  SheetButtonGroup,
  useUseableScreenHeight,
} from "~/components/Sheet";
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
  const languageCode = usePreferenceStore((s) => s.language);
  const trueSheetHeight = useUseableScreenHeight();

  const shouldSnapTop = useMemo(() => {
    const estimatedHeaderHeight = 87;
    const estimatedContentHeight = (56 + 4) * LANGUAGES.length;
    const estimatedSheetContentHeight =
      estimatedHeaderHeight + estimatedContentHeight + 16;

    return estimatedSheetContentHeight > trueSheetHeight - 56;
  }, [trueSheetHeight]);

  return (
    <Sheet
      ref={props.sheetRef}
      titleKey="feat.language.title"
      scrollable={shouldSnapTop}
      snapTop={shouldSnapTop}
      contentContainerClassName="pb-0"
    >
      <FlatList
        accessibilityRole="radiogroup"
        data={LANGUAGES}
        keyExtractor={({ code }) => code}
        renderItem={({ item }) => (
          <Radio
            selected={languageCode === item.code}
            onSelect={() => PreferenceSetters.setLanguage(item.code)}
          >
            <StyledText>{item.name}</StyledText>
          </Radio>
        )}
        nestedScrollEnabled={shouldSnapTop}
        contentContainerClassName="gap-1 pb-4"
      />
    </Sheet>
  );
}
