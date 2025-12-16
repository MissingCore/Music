import { useExportBackup, useImportBackup } from "~/modules/backup/JSON";

import { mutateGuard } from "~/lib/react-query";
import type { TrueSheetRef } from "~/components/Sheet";
import { SheetButtonGroup } from "~/components/Sheet";
import { DetachedSheet } from "~/components/Sheet/Detached";
import { TStyledText } from "~/components/Typography/StyledText";

export function BackupSheet(props: { ref: TrueSheetRef }) {
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();

  const inProgress = exportBackup.isPending || importBackup.isPending;

  return (
    <DetachedSheet ref={props.ref} titleKey="feat.backup.title">
      <TStyledText textKey="feat.backup.description" dim className="text-sm" />
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
    </DetachedSheet>
  );
}
