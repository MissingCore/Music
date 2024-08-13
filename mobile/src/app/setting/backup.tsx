import { Text, View } from "react-native";

import {
  useExportBackup,
  useImportBackup,
} from "@/features/setting/api/backup";

import { mutateGuard } from "@/lib/react-query";
import { Button } from "@/components/form/button";
import { AnimatedHeader } from "@/components/navigation/animated-header";
import { Description } from "@/components/ui/text";

/** Screen for `/setting/backup` route. */
export default function BackupScreen() {
  const exportBackupFn = useExportBackup();
  const importBackupFn = useImportBackup();

  const disableActions = exportBackupFn.isPending || importBackupFn.isPending;

  return (
    <AnimatedHeader title="BACKUP">
      <Description intent="setting" className="mb-6">
        Import or export{" "}
        <Text className="text-foreground100">`music_backup.json`</Text>{" "}
        containing information about your favorited albums, playlists, and
        tracks. Useful for transferring your data between the APK & Play Store
        versions of the app.
      </Description>

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
    </AnimatedHeader>
  );
}
