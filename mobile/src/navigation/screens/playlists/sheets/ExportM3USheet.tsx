// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/next/base/button";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { TText } from "~/components/next/base/typography";
import { SegmentedPicker } from "~/components/next/blocks/segmented-picker";
import { exportPlaylistAsM3U } from "~/modules/backup/M3U";

type ExportOption = "absolute" | "relative";

export function ExportM3USheet(props: { ref: SheetRef; id: string }) {
  const { t } = useTranslation();
  const [exportOption, setExportOption] = useState<ExportOption>("absolute");
  const [isExporting, setIsExporting] = useState(false);

  const pickerOptions = useMemo(
    () => [
      { label: t("feat.playlist.extra.absolute"), value: "absolute" as const },
      { label: t("feat.playlist.extra.relative"), value: "relative" as const },
    ],
    [t],
  );

  const onExport = async () => {
    setIsExporting(true);
    try {
      await exportPlaylistAsM3U(props.id, exportOption === "absolute");
      toast.t("feat.backup.extra.exportSuccess");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Sheet ref={props.ref} onCleanup={() => setExportOption("absolute")}>
      <Sheet.Header label={t("feat.playlist.extra.m3uExport")} />

      <SegmentedPicker
        type="radio"
        options={pickerOptions}
        selected={exportOption}
        onSelect={setExportOption}
      />

      <Button
        onPress={onExport}
        disabled={isExporting}
        filled
        className="mt-4 rounded-full"
      >
        <TText
          textKey="feat.backup.extra.export"
          numberOfLines={1}
          bold
          size="sm"
          className="shrink"
        />
      </Button>
    </Sheet>
  );
}
