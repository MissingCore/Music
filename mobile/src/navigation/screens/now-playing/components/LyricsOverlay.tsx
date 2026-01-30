import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLyricForTrack } from "~/queries/lyric";
import { usePlaybackStore } from "~/stores/Playback/store";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useTheme } from "~/hooks/useTheme";

import { cn } from "~/lib/style";
import { FlatList, useFlatListRef } from "~/components/Defaults";
import { Button } from "~/components/Form/Button";
import { TopDownGradient } from "~/components/Gradient";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

const SCROLL_OFFSET = 64;
const LINE_GAP = 16;

export function LyricsOverlay(props: { size: number; trackId: string }) {
  const { top } = useSafeAreaInsets();
  const { scheme } = useTheme();
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
        <LyricsContent trackId={props.trackId} offset={lyricsOffset} />
      </View>

      <TopDownGradient
        height={lyricsOffset}
        startFrom={screenDesign === "vinylOld" ? top : topOffset}
        className="absolute top-0 left-0"
      />
      <TopDownGradient
        height={SCROLL_OFFSET}
        className="absolute bottom-0 left-0 rotate-180"
      />
    </View>
  );
}

function LyricsContent(props: { trackId: string; offset: number }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isPending, data, error } = useLyricForTrack(props.trackId);

  const lyricsLines = useMemo(() => {
    if (!data?.lyrics) return [];
    return data.lyrics.split("\n");
  }, [data?.lyrics]);

  const isSynchronized = useMemo(
    () => lyricsLines.every((line) => (!line ? true : LRC_LINE.test(line))),
    [lyricsLines],
  );

  if (isPending) return null;
  else if (error || !data) {
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
  } else if (isSynchronized) {
    return <SynchronizedLyrics lines={lyricsLines} offset={props.offset} />;
  }
  return (
    <FlatList
      data={lyricsLines}
      keyExtractor={(_, index) => `${index}`}
      renderItem={({ item }) => (
        <StyledText bold className="text-xl">
          {item}
        </StyledText>
      )}
      contentContainerStyle={{
        paddingTop: props.offset,
        paddingBottom: SCROLL_OFFSET,
        gap: LINE_GAP,
      }}
    />
  );
}

//#region Synchronized Lyrics
function SynchronizedLyrics(props: { lines: string[]; offset: number }) {
  const position = usePlaybackStore((s) => s.lastPosition);
  const listRef = useFlatListRef();
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [autoScroll, setAutoScroll] = useState(true);

  const parsedLines = useMemo(() => parseLines(props.lines), [props.lines]);

  // Call `mounted` after a delay as for some weird reason, `scrollToIndex`
  // doesn't initially work when called.
  const onLayout = useCallback(() => {
    setTimeout(() => setMounted(true), 250);
  }, []);

  useEffect(() => {
    // Calculate active index.
    const positionMS = position * 1000;
    const numLines = parsedLines.length;
    let newIndex = -1;
    for (let i = 0; i < numLines; i++) {
      if (parsedLines[i]!.timeMS > positionMS) break;
      newIndex += 1;
    }
    setActiveIndex(newIndex);

    // Scroll to active index.
    if (!listRef.current || !mounted || !autoScroll) return;
    if (newIndex === -1) {
      listRef.current.scrollToOffset({ offset: 0 });
      return;
    }
    listRef.current.scrollToIndex({
      index: newIndex,
      viewOffset: (SCROLL_OFFSET + LINE_GAP) / 2,
      viewPosition: 0.5,
    });
  }, [listRef, parsedLines, position, mounted, autoScroll]);

  const debouncedScrollEnd = useMemo(() => {
    let timeout: ReturnType<typeof setTimeout>;
    return () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => setAutoScroll(true), 1000);
    };
  }, []);

  return (
    <FlatList
      ref={listRef}
      onLayout={onLayout}
      data={parsedLines}
      keyExtractor={(_, index) => `${index}`}
      renderItem={({ item, index }) => (
        <StyledText
          bold
          className={cn("text-xl", {
            "text-onSurfaceVariant/50": index !== activeIndex,
          })}
        >
          {item.lyric}
        </StyledText>
      )}
      onScrollBeginDrag={() => setAutoScroll(false)}
      onScrollEndDrag={debouncedScrollEnd}
      // Suppresses error when `scrollToIndex` fails.
      onScrollToIndexFailed={() => {}}
      contentContainerStyle={{
        paddingTop: props.offset,
        paddingBottom: SCROLL_OFFSET,
        gap: LINE_GAP,
      }}
    />
  );
}

const LRC_LINE = /^(\[[0-9]+:[0-9]+(\.[0-9]+)?\])+.*/;
const LRC_TIMESTAMP_WITH_BRACKET = /\[[0-9]+:[0-9]+(\.[0-9]+)?\]/g;
const LRC_TIMESTAMP = /[0-9]+/g;

type SynchronizedLine = { timeMS: number; lyric: string };

function parseLines(lines: string[]): SynchronizedLine[] {
  const results: SynchronizedLine[] = [];
  for (const line of lines) {
    if (!line) continue;
    const timeString = line.match(LRC_TIMESTAMP_WITH_BRACKET);
    if (!timeString || timeString.length === 0) continue;
    const lyricLine = line.replace(LRC_TIMESTAMP_WITH_BRACKET, "");
    const [min, sec, ms = "0"] = timeString[0]!.match(LRC_TIMESTAMP) as [
      string,
      string,
      ...string[],
    ];
    results.push({
      timeMS:
        Number.parseInt(min) * 60 * 1000 +
        Number.parseInt(sec) * 1000 +
        Number.parseInt(ms),
      lyric: lyricLine.trim(),
    });
  }

  return results;
}
//#endregion
