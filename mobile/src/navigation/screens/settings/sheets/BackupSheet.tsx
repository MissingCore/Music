// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useTranslation } from "react-i18next";

import { useExportBackup, useImportBackup } from "~/modules/backup/JSON";

import { mutateGuard } from "~/lib/react-query";
import { SheetButtonGroup } from "~/components/Sheet/SheetButtonGroup";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { TText } from "~/components/next/base/typography";

export function BackupSheet(props: { ref: SheetRef }) {
  const { t } = useTranslation();
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();

  const inProgress = exportBackup.isPending || importBackup.isPending;

  return (
    <Sheet ref={props.ref}>
      <Sheet.Header label={t("feat.backup.title")} />

      <TText textKey="feat.backup.description" muted size="sm" />
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
