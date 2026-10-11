// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useTranslation } from "react-i18next";

import { useExportBackup, useImportBackup } from "~/modules/backup/JSON";

import { mutateGuard } from "~/lib/react-query";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { ActionButton } from "~/components/next/blocks/button-action";
import { Hint } from "~/components/next/blocks/hint";

export function BackupSheet(props: { ref: SheetRef }) {
  const { t } = useTranslation();
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();

  const inProgress = exportBackup.isPending || importBackup.isPending;

  return (
    <Sheet ref={props.ref}>
      <Sheet.Actions>
        <ActionButton
          label={t("feat.backup.extra.export")}
          onPress={() => mutateGuard(exportBackup, undefined)}
          disabled={inProgress}
          leadingIcon="download"
          className="rounded-lg"
        />
        <ActionButton
          label={t("feat.backup.extra.import")}
          onPress={() => mutateGuard(importBackup, undefined)}
          disabled={inProgress}
          leadingIcon="upload"
          className="rounded-lg"
        />
      </Sheet.Actions>
      <Sheet.Footer>
        <Hint hint={t("feat.backup.description")} />
      </Sheet.Footer>
    </Sheet>
  );
}
