import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { SheetProps } from "react-native-actions-sheet";

import { useExportBackup, useImportBackup } from "./data";

import { mutateGuard } from "@/lib/react-query";
import { Button } from "@/components/Form";
import { Sheet } from "@/components/Sheet";
import { StyledText } from "@/components/Typography";

/** Sheet allowing us to utilize the "backup" feature of this app. */
export default function BackupSheet(props: SheetProps<"backup-sheet">) {
  const { t } = useTranslation();
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();

  const inProgress = exportBackup.isPending || importBackup.isPending;

  return (
    <Sheet
      id={props.sheetId}
      title={t("title.backup")}
      contentContainerClassName="gap-4"
    >
      <StyledText preset="dimOnCanvas" center className="text-sm">
        {t("settings.description.backup")}
      </StyledText>

      <View className="mt-2 flex-row gap-2">
        <Button
          onPress={() => mutateGuard(exportBackup, undefined)}
          disabled={inProgress}
          className="flex-1"
        >
          <StyledText bold center className="text-sm">
            {t("settings.related.export")}
          </StyledText>
        </Button>
        <Button
          onPress={() => mutateGuard(importBackup, undefined)}
          disabled={inProgress}
          className="flex-1"
        >
          <StyledText bold center className="text-sm">
            {t("settings.related.import")}
          </StyledText>
        </Button>
      </View>
    </Sheet>
  );
}
