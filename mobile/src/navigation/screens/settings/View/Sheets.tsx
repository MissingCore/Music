import { useExportBackup, useImportBackup } from "~/modules/backup/JSON";

import { mutateGuard } from "~/lib/react-query";
import type { TrueSheetRef } from "~/components/Sheet";
import { Sheet, SheetButtonGroup } from "~/components/Sheet";
import { TStyledText } from "~/components/Typography/StyledText";

/** All the sheets used on `/setting` route. */
export function SettingsSheets(props: Record<"backupRef", TrueSheetRef>) {
  return <BackupSheet sheetRef={props.backupRef} />;
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
