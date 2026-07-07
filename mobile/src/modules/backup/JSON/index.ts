// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useMutation } from "@tanstack/react-query";

import { clearAllQueries } from "~/lib/react-query";
import { importBackup, exportBackup } from "./v1";

export const useExportBackup = () => {
  return useMutation({
    mutationFn: exportBackup,
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
    mutationFn: importBackup,
    onSuccess: () => {
      clearAllQueries();
      toast.t("feat.backup.extra.importSuccess");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
};
