import { toast } from "@missingcore/ui/toast";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ExtendedTButton } from "~/components/Form/Button";
import type { PickerOption } from "~/components/Form/SegmentedPicker";
import { SegmentedPicker } from "~/components/Form/SegmentedPicker";
import { DetachedSheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { exportPlaylistAsM3U } from "~/modules/backup/M3U";

export function ExportM3USheet(props: { ref: TrueSheetRef; id: string }) {
  const { t } = useTranslation();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const pickerOptions: PickerOption[] = useMemo(
    () => [
      { icon: "conversion-path", label: t("feat.playlist.extra.absolute") },
      { icon: "graph-1", label: t("feat.playlist.extra.relative") },
    ],
    [t],
  );

  const onExport = async () => {
    setIsExporting(true);
    try {
      await exportPlaylistAsM3U(props.id, selectedIdx === 0);
      toast.t("feat.backup.extra.exportSuccess");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DetachedSheet
      ref={props.ref}
      titleKey="feat.playlist.extra.m3uExport"
      onCleanup={() => setSelectedIdx(0)}
    >
      <SegmentedPicker
        options={pickerOptions}
        selectedIndex={selectedIdx}
        onOptionSelected={setSelectedIdx}
      />
      <ExtendedTButton
        textKey="feat.backup.extra.export"
        onPress={onExport}
        disabled={isExporting}
        className="mt-4 rounded-full"
      />
    </DetachedSheet>
  );
}
