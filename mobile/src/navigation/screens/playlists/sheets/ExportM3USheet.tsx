// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { FlatList } from "~/components/Base/List";
import type { SheetRef } from "~/components/next/base/sheet";
import { ScrollableSheet } from "~/components/next/base/sheet";
import { Text } from "~/components/next/base/typography";
import { ActionButton } from "~/components/next/blocks/button-action";
import { Marquee } from "~/components/next/blocks/marquee";
import { RadioField } from "~/components/next/blocks/radio";
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
    <ScrollableSheet
      ref={props.ref}
      onCleanup={() => setExportOption("absolute")}
    >
      <FlatList
        role="radiogroup"
        data={pickerOptions}
        keyExtractor={({ value }) => value}
        renderItem={({ item: { value, label } }) => {
          const selected = value === exportOption;
          return (
            <RadioField
              selected={selected}
              onSelect={() => setExportOption(value)}
              className="rounded-none p-4"
            >
              <Marquee>
                <Text>{label}</Text>
              </Marquee>
            </RadioField>
          );
        }}
        scrollEnabled={false}
        className="rounded-xl bg-surfaceContainerLowest"
      />
      <ActionButton
        label={t("feat.backup.extra.export")}
        leadingIcon="download"
        onPress={onExport}
        disabled={isExporting}
        intent="inverse"
      />
    </ScrollableSheet>
  );
}
