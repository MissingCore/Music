import { toast } from "@backpackapp-io/react-native-toast";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ConversionPath } from "~/resources/icons/ConversionPath";
import { Graph1 } from "~/resources/icons/Graph1";

import { ToastOptions } from "~/lib/toast";
import { ExtendedTButton } from "~/components/Form/Button";
import type { PickerOption } from "~/components/Form/SegmentedPicker";
import { SegmentedPicker } from "~/components/Form/SegmentedPicker";
import { Sheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { exportPlaylistAsM3U } from "~/modules/backup/M3U";
import { deferInitialRender } from "../../../components/DeferredRender";

/** Enables us to export a playlist as an M3U file. */
export const ExportM3USheet = deferInitialRender(
  function ExportM3USheet(props: { ref: TrueSheetRef; id: string }) {
    const { t } = useTranslation();
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [isExporting, setIsExporting] = useState(false);

    const pickerOptions: PickerOption[] = useMemo(
      () => [
        { Icon: ConversionPath, label: t("feat.playlist.extra.absolute") },
        { Icon: Graph1, label: t("feat.playlist.extra.relative") },
      ],
      [t],
    );

    const onExport = async () => {
      setIsExporting(true);
      try {
        await exportPlaylistAsM3U(props.id, selectedIdx === 0);
        toast(t("feat.backup.extra.exportSuccess"), ToastOptions);
      } catch (err) {
        toast.error((err as Error).message, ToastOptions);
      } finally {
        setIsExporting(false);
      }
    };

    return (
      <Sheet
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
      </Sheet>
    );
  },
);
