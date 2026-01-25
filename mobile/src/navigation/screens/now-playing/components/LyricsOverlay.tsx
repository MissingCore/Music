import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLyricForTrack } from "~/queries/lyric";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useTheme } from "~/hooks/useTheme";

import { cn } from "~/lib/style";
import { ScrollView } from "~/components/Defaults";
import { Button } from "~/components/Form/Button";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

const SCROLL_OFFSET = 64;

export function LyricsOverlay(props: LyricsContentProps) {
  const { top } = useSafeAreaInsets();
  const { scheme, surface } = useTheme();
  const screenDesign = usePreferenceStore((s) => s.nowPlayingDesign);

  // Estimated offset to get overlay to go behind the `TopAppBar`.
  const topOffset = top + 57;
  const lyricsOffset = topOffset + SCROLL_OFFSET;

  return (
    <View
      style={{ top: -topOffset, bottom: 0 }}
      className={cn(
        "absolute w-full items-center justify-center bg-surface/85",
        { "bg-surface/60": scheme === "dark" },
      )}
    >
      <View style={{ width: props.size }} className="px-2">
        <LyricsContent {...props} offset={lyricsOffset} />
      </View>

      <LinearGradient
        colors={[`${surface}FF`, `${surface}00`]}
        locations={[
          (screenDesign === "vinylOld" ? top : topOffset) / lyricsOffset,
          1,
        ]}
        pointerEvents="none"
        style={{ height: lyricsOffset }}
        className="absolute top-0 left-0 w-full"
      />
      <LinearGradient
        colors={[`${surface}00`, `${surface}E6`]}
        pointerEvents="none"
        style={{ height: SCROLL_OFFSET }}
        className="absolute bottom-0 left-0 w-full"
      />
    </View>
  );
}

type LyricsContentProps = { size: number; trackId: string };

function LyricsContent(props: LyricsContentProps & { offset: number }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isPending, data, error } = useLyricForTrack(props.trackId);

  if (isPending) return null;
  if (error || !data) {
    return (
      <View
        style={{ paddingTop: props.offset }}
        className="items-center gap-8 pb-4"
      >
        <TStyledText
          textKey="feat.lyrics.extra.notFound"
          bold
          className="text-lg"
        />
        <Button
          onPress={() => navigation.navigate("Lyrics")}
          className="rounded-full bg-primary px-8 active:bg-primaryDim"
        >
          <StyledText bold className="text-center text-sm text-onPrimary">
            {t("template.entryManage", { name: t("feat.lyrics.title") })}
          </StyledText>
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: props.offset,
        paddingBottom: SCROLL_OFFSET,
      }}
    >
      <StyledText bold className="text-xl">
        {data.lyrics}
      </StyledText>
    </ScrollView>
  );
}
