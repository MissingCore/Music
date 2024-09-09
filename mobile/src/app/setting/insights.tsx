import { Text, View } from "react-native";

import { Ionicons } from "@/resources/icons";
import {
  useUserDataInfo,
  useStatisticsInfo,
  useImageSaveStatus,
} from "@/features/setting/api/insights";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { AnimatedHeader } from "@/components/navigation/animated-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Description, Heading } from "@/components/ui/text";
import { abbreviateSize } from "@/features/setting/utils";
import { getPlayTime } from "@/features/track/utils";

/** Screen for `/setting/insights` route. */
export default function InsightsScreen() {
  return (
    <AnimatedHeader title="解析">
      <Description intent="setting" className="mb-6">
        再生可能なメディアに関する情報とデバイスに保存されている<Text className="font-ndo        t57">音楽</Text>の内容を確認します。
      </Description>

      <UserDataWidget />
      <StatisticsWidget />
      <AllImagesSavedWidget />
    </AnimatedHeader>
  );
}

/** Displays what's stored on this device. */
function UserDataWidget() {
  const { isPending, error, data } = useUserDataInfo();
  if (isPending || error) return null;
  return (
    <View className="mb-6 rounded-lg bg-surface800 p-4">
      <Heading as="h4" className="mb-4 text-start font-ndot57 tracking-tight">
        ユーザーデータ
      </Heading>

      <ProgressBar
        entries={[
          { color: Colors.accent500, value: data.images },
          { color: "#FFC800", value: data.database },
          { color: "#4142BE", value: data.other },
          { color: Colors.foreground100, value: data.cache },
        ]}
        total={data.total}
        className="mb-4"
      />

      <ValueRow
        label="画像"
        value={abbreviateSize(data.images)}
        barColor={Colors.accent500}
      />
      <ValueRow
        label="データベース"
        value={abbreviateSize(data.database)}
        barColor="#FFC800"
      />
      <ValueRow
        label="その他"
        value={abbreviateSize(data.other)}
        barColor="#4142BE"
      />
      <ValueRow
        label="キャッシュ"
        value={abbreviateSize(data.cache)}
        barColor={Colors.foreground100}
      />

      <ValueRow
        label="合計"
        value={abbreviateSize(data.total)}
        className="mb-0 mt-2"
      />
    </View>
  );
}

/** Display what's tracked by the database. */
function StatisticsWidget() {
  const { isPending, error, data } = useStatisticsInfo();
  if (isPending || error) return null;
  return (
    <View className="mb-6 rounded-lg bg-surface800 p-4">
      <Heading as="h4" className="mb-4 text-start font-ndot57 tracking-tight">
        統計
      </Heading>

      <ValueRow label="アルバム" value={data.albums} />
      <ValueRow label="アーティスト" value={data.artists} />
      <ValueRow label="画像" value={data.images} />
      <ValueRow label="プレイリスト" value={data.playlists} />
      <ValueRow label="曲" value={data.tracks} />
      <ValueRow label="エラーの保存" value={data.invalidTracks} />

      <ValueRow
        label="合計時間"
        value={getPlayTime(data.totalDuration)}
        className="mb-0 mt-2"
      />
    </View>
  );
}

/** Display whether all images have been saved. */
function AllImagesSavedWidget() {
  const { isPending, error, data: allSaved } = useImageSaveStatus();
  if (isPending || error) return null;
  return (
    <View className="flex-row justify-between gap-4 rounded-lg bg-surface800 p-4">
      <Heading
        as="h4"
        className="text-start font-ndot57 leading-tight tracking-tight"
      >
        すべての画像を保存しますか?
      </Heading>
      <Ionicons
        name={allSaved ? "checkmark-circle-outline" : "close-circle-outline"}
      />
    </View>
  );
}

type ValueRowProps = {
  label: string;
  value: string | number;
  barColor?: string;
  className?: string;
};

/** Displays a label & value in a row. */
function ValueRow({ label, value, barColor, className }: ValueRowProps) {
  return (
    <View className={cn("mb-2 flex-row justify-between gap-2", className)}>
      <View className="shrink flex-row items-center gap-2">
        {!!barColor && (
          <View
            style={{ backgroundColor: barColor }}
            className="size-[9px] rounded-full"
          />
        )}
        <Text className="shrink font-geistMono text-xs tracking-tight text-foreground50">
          {label}
        </Text>
      </View>
      <Text className="font-geistMonoLight text-xs tracking-tighter text-foreground100">
        {value}
      </Text>
    </View>
  );
}
