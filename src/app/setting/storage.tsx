import { Text, View } from "react-native";

import {
  useExportBackup,
  useImportBackup,
} from "@/features/setting/api/backup";
import { useStorageInfo } from "@/features/setting/api/storage";

import { Colors } from "@/constants/Styles";
import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import { Button } from "@/components/form/button";
import { AnimatedHeader } from "@/components/navigation/AnimatedHeader";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Heading } from "@/components/ui/text";
import { Description } from "@/features/setting/components/UI";
import { abbreviateSize } from "@/features/setting/utils";
import { getPlayTime } from "@/features/track/utils";

/** @description Screen for `/setting/storage` route. */
export default function StorageScreen() {
  return (
    <AnimatedHeader title="STORAGE & STATISTICS">
      <Description className="mb-8">
        See what <Text className="font-ndot57">Music</Text> have stored on your
        device along with information about the playable media.
      </Description>
      <InfoWidgets />

      <Heading as="h1" className="mb-8 mt-[22px] text-start">
        Backup
      </Heading>
      <Description className="mb-8">
        Import or export{" "}
        <Text className="text-foreground100">`music_backup.json`</Text>{" "}
        containing information about your favorited albums, playlists, and
        tracks. Useful for transferring your data between the APK & Play Store
        versions of the app.
      </Description>
      <BackupActions />
    </AnimatedHeader>
  );
}

/** @description The 2 widgets containing information about storage & statistics. */
function InfoWidgets() {
  const { isPending, error, data } = useStorageInfo();

  if (isPending || error) return null;

  return (
    <>
      <View className="mb-4 rounded-lg bg-surface800 p-4">
        <Heading as="h3" className="mb-4 text-start">
          User Data
        </Heading>

        <ProgressBar
          entries={[
            { color: Colors.accent500, value: data.userData.images },
            { color: "#FFC800", value: data.userData.database },
            { color: "#4142BE", value: data.userData.other },
            { color: Colors.foreground100, value: data.userData.cache },
          ]}
          total={data.userData.total}
          className="mb-4"
        />

        <ValueRow
          label="Images"
          value={abbreviateSize(data.userData.images)}
          barColor={Colors.accent500}
        />
        <ValueRow
          label="Database"
          value={abbreviateSize(data.userData.database)}
          barColor="#FFC800"
        />
        <ValueRow
          label="Other"
          value={abbreviateSize(data.userData.other)}
          barColor="#4142BE"
        />
        <ValueRow
          label="Cache"
          value={abbreviateSize(data.userData.cache)}
          barColor={Colors.foreground100}
        />

        <ValueRow
          label="Total"
          value={abbreviateSize(data.userData.total)}
          className="mb-0 mt-2"
        />
      </View>

      <View className="mb-4 rounded-lg bg-surface800 p-4">
        <Heading as="h3" className="mb-4 text-start">
          Statistics
        </Heading>

        <ValueRow label="Albums" value={data.statistics.albums} />
        <ValueRow label="Artists" value={data.statistics.artists} />
        <ValueRow label="Images" value={data.statistics.images} />
        <ValueRow label="Playlists" value={data.statistics.playlists} />
        <ValueRow label="Tracks" value={data.statistics.tracks} />

        <ValueRow
          label="Total Duration"
          value={getPlayTime(data.statistics.totalDuration)}
          className="mb-0 mt-2"
        />
      </View>
    </>
  );
}

type ValueRowProps = {
  label: string;
  value: string | number;
  barColor?: string;
  className?: string;
};

/** @description Displays a label & value in a row. */
function ValueRow({ label, value, barColor, className }: ValueRowProps) {
  return (
    <View className={cn("mb-2 flex-row justify-between gap-2", className)}>
      <View className="shrink flex-row items-center gap-2">
        {barColor && (
          <View
            style={{ backgroundColor: barColor }}
            className="size-[9px] rounded-full"
          />
        )}
        <Text className="shrink font-geistMono text-sm text-foreground50">
          {label}
        </Text>
      </View>
      <Text className="font-geistMonoLight text-xs text-foreground100">
        {value}
      </Text>
    </View>
  );
}

/** @description Actions for "Backup" feature. */
function BackupActions() {
  const exportBackupFn = useExportBackup();
  const importBackupFn = useImportBackup();

  const disableActions = exportBackupFn.isPending || importBackupFn.isPending;

  return (
    <View className="mb-4 flex-row gap-2">
      <Button
        variant="outline"
        theme="neutral"
        onPress={() => mutateGuard(exportBackupFn, undefined)}
        disabled={disableActions}
        wrapperClassName="flex-1 p-4"
        textClassName="text-foreground100"
      >
        Export
      </Button>
      <Button
        variant="outline"
        theme="neutral"
        onPress={() => mutateGuard(importBackupFn, undefined)}
        disabled={disableActions}
        wrapperClassName="flex-1 p-4"
        textClassName="text-foreground100"
      >
        Import
      </Button>
    </View>
  );
}
