// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useMutation } from "@tanstack/react-query";
import * as v from "valibot";

import { createLyricProvider, getAllLyricProvider } from "../core/actions";

import type { LyricProvider } from "../core/constants";
import { LyricProviderEntrySchema } from "../core/constants";

import { pickDirectory, pickFile } from "~/lib/file-system";
import { FormSchema } from "~/modules/form/utils";
import i18next from "~/modules/i18n";

const BackupSchema = v.object({
  version: FormSchema.RealNumber,
  exportedAt: FormSchema.NonEmptyString,
  backup: v.array(LyricProviderEntrySchema),
});

//#region Export
async function exportLyricsProviderBackup() {
  const providers = getAllLyricProvider();

  // User selects location to save this backup file.
  const dir = await pickDirectory();

  // Create a new file in specified directory & write contents.
  const backupFile = dir.createFile(
    "lyrics_provider_backup",
    "application/json",
  );
  await backupFile.write(
    JSON.stringify({
      version: 1,
      exportedAt: new Date().toString(),

      backup: providers,
    } satisfies v.InferOutput<typeof BackupSchema>),
  );
}

export const useExportLyricsProviderBackup = () => {
  return useMutation({
    mutationFn: exportLyricsProviderBackup,
    onSuccess: () => {
      toast.t("feat.backup.extra.exportSuccess");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
};

async function importLyricsProviderBackup() {
  const backupFile = await pickFile([
    "application/json",
    "application/octet-stream",
  ]);

  // Read, parse, and validate file contents.
  let _backupContents;
  // console.log(await backupFile.json())
  try {
    // Validate the data structure.
    _backupContents = v.parse(BackupSchema, await backupFile.json());
  } catch {
    throw new Error(i18next.t("err.msg.invalidStructure"));
  }
  const backupContents: Omit<LyricProvider, "id">[] = _backupContents.backup;
  backupContents.forEach((provider) => {
    createLyricProvider(provider);
  });
}

export const useImportLyricsProviderBackup = () => {
  return useMutation({
    mutationFn: importLyricsProviderBackup,
    onSuccess: () => {
      toast.t("feat.backup.extra.importSuccess");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
};
