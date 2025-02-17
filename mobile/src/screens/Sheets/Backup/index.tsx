import { View } from "react-native";

import { useExportBackup, useImportBackup } from "./data";

import { mutateGuard } from "~/lib/react-query";
import { Button } from "~/components/Form/Button";
import { Sheet } from "~/components/Sheet";
import { TStyledText } from "~/components/Typography/StyledText";

/** Sheet allowing us to utilize the "backup" feature of this app. */
export default function BackupSheet() {
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();

  const inProgress = exportBackup.isPending || importBackup.isPending;

  return (
    <Sheet
      id="BackupSheet"
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
