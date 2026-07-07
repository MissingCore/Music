// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useMutation } from "@tanstack/react-query";

import i18next from "~/modules/i18n";

import { pickFile } from "~/lib/file-system";
import { clearAllQueries } from "~/lib/react-query";
import { isRecord } from "~/utils/validation";
import { importBackup } from "./v1";
import { exportBackupV2, importBackupV2 } from "./v2";

export const useExportBackup = () => {
  return useMutation({
    mutationFn: exportBackupV2,
    onSuccess: () => {
      toast.t("feat.backup.extra.exportSuccess");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
};

export const useImportBackup = () => {
  return useMutation({
    mutationFn: decideImportVersion,
    onSuccess: () => {
      clearAllQueries();
      toast.t("feat.backup.extra.importSuccess");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
};

//#region Helpers
/** Based on the picked file, determines which JSON backup version is used. */
async function decideImportVersion() {
  const backupFile = await pickFile([
    "application/json",
    "application/octet-stream",
  ]);

  let jsonContent: any;
  try {
    // Ensure a JSON object is returned.
    jsonContent = await backupFile.json();
    if (!isRecord(jsonContent)) throw new Error();
  } catch {
    throw new Error(i18next.t("err.msg.invalidStructure"));
  }

  if (jsonContent.version === 2) return importBackupV2(jsonContent);
  return importBackup(jsonContent);
}
//#endregion
