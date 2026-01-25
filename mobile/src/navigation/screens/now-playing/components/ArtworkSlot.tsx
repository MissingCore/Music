import { useNavigation } from "@react-navigation/native";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { LayoutChangeEvent } from "react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLyricForTrack } from "~/queries/lyric";
import { useSessionStore } from "~/services/SessionStore";
import { useCurrentTheme } from "~/hooks/useTheme";

import { ArtworkPicker } from "./Artwork";

import { cn } from "~/lib/style";
import { ScrollView } from "~/components/Defaults";
import { Button } from "~/components/Form/Button";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

/** Renders in the top portion of the Now Playing screen, handling the current artwork and lyrics. */
export function ArtworkSlot(props: {
  artwork: string | null;
  trackId: string;
}) {
  const showLyrics = useSessionStore((s) => s.showLyrics);
  const { containerProps, size } = useArtworkSize();

  return (
    <View {...containerProps} className="flex-1">
      <View
        pointerEvents={showLyrics ? "none" : undefined}
        className="flex-1 items-center justify-center"
      >
        <ArtworkPicker source={props.artwork} size={size} />
      </View>
      {showLyrics ? (
        <LyricsOverlay size={size} trackId={props.trackId} />
      ) : null}
    </View>
  );
}

//#region Lyrics Overlay
function LyricsOverlay(props: LyricsContentProps) {
  const insets = useSafeAreaInsets();
  const currTheme = useCurrentTheme();

  // Estimated offset to get overlay to go behind the `TopAppBar`.
  const topOffset = insets.top + 57;

  return (
    <View
      style={{ top: -topOffset, bottom: 0 }}
      className={cn(
        "absolute z-50 w-full items-center justify-center bg-surface/85",
        { "bg-surface/60": currTheme === "dark" },
      )}
    >
      <View style={{ width: props.size }} className="px-4">
        <LyricsContent {...props} offset={topOffset} />
      </View>
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
    <ScrollView contentContainerStyle={{ paddingTop: props.offset }}>
      <StyledText bold className="text-xl">
        {data.lyrics}
      </StyledText>
    </ScrollView>
  );
}
//#endregion

//#region Helpers
function useArtworkSize() {
  const [size, setSize] = useState(0);
  const containerRef = useRef<View>(null);

  /* Calculate the size of the artwork that maximizes the space. */
  useLayoutEffect(() => {
    containerRef.current?.measure((_x, _y, width, height) => {
      // Exclude the padding around the image depending on which measurement is used.
      setSize(Math.min(height, width) - 32);
    });
  }, []);

  const containerProps = useMemo(
    () => ({
      ref: containerRef,
      onLayout: (e: LayoutChangeEvent) => {
        const { height, width } = e.nativeEvent.layout;
        setSize(Math.min(height, width) - 32);
      },
    }),
    [],
  );

  return useMemo(() => ({ containerProps, size }), [containerProps, size]);
}
//#endregion
