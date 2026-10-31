// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useExportBackup, useImportBackup } from "~/modules/backup/JSON";

import { mutateGuard } from "~/lib/react-query";
import type { SheetRef } from "~/components/next/base/sheet2";
import { Sheet, SheetFooter } from "~/components/next/base/sheet2";
import { ActionButton } from "~/components/next/blocks/button-action";
import { Hint } from "~/components/next/blocks/hint";

export function BackupSheet(props: { ref: SheetRef }) {
  const { t } = useTranslation();
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();

  const inProgress = exportBackup.isPending || importBackup.isPending;

  return (
    <Sheet
      ref={props.ref}
      footer={
        <SheetFooter>
          <Hint hint={t("feat.backup.description")} />
        </SheetFooter>
      }
    >
      <View className="flex-row items-center gap-0.75 pb-4">
        <ActionButton
          label={t("feat.backup.extra.export")}
          onPress={() => mutateGuard(exportBackup, undefined)}
          disabled={inProgress}
          leadingIcon="download"
          className="flex-1 rounded-lg rounded-r-xs"
        />
        <ActionButton
          label={t("feat.backup.extra.import")}
          onPress={() => mutateGuard(importBackup, undefined)}
          disabled={inProgress}
          leadingIcon="upload"
          className="flex-1 rounded-lg rounded-l-xs"
        />
      </View>
    </Sheet>
  );
}
