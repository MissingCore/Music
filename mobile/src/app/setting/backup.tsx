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
    <AnimatedHeader title="バックアップ">
      <Description intent="setting" className="mb-6">
      お気に入りのアルバム、プレイリスト、曲に関する情報を含む{" "}
      <Text className="text-foreground100">｢music_backup.json｣</Text>{" "}を          インポートまたはエクスポートします。アプリの APK バージョンと Play ストアバージョン         間でのデータ転送時に役立ちます。
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
          エクスポート
        </Button>
        <Button
          variant="outline"
          theme="neutral"
          onPress={() => mutateGuard(importBackupFn, undefined)}
          disabled={disableActions}
          wrapperClassName="flex-1 p-4"
          textClassName="text-foreground100"
        >
          インポート
        </Button>
      </View>
    </AnimatedHeader>
  );
}
