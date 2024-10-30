import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useExportBackup, useImportBackup } from "./data";

import { mutateGuard } from "@/lib/react-query";
import { Button } from "@/components/new/Form";
import { ModalHeader, ModalSheet } from "@/components/new/Modal";
import { StyledText } from "@/components/new/Typography";

/** Modal to utilize the "backup" feature of this app. */
export const BackupModal = forwardRef<BottomSheetModal, {}>(
  function BackupModal(_props, ref) {
    const { t } = useTranslation();
    const exportBackup = useExportBackup();
    const importBackup = useImportBackup();

    const inProgress = exportBackup.isPending || importBackup.isPending;

    return (
      <ModalSheet ref={ref} enableOverDrag={false}>
        <BottomSheetView className="gap-4">
          <ModalHeader title={t("title.backup")} noPadding />
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
        </BottomSheetView>
      </ModalSheet>
    );
  },
);
