import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
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

  const parsedLines = useMemo(() => parseLines(props.lines), [props.lines]);

  //#region Auto Scroll
  const autoScrollResumeTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const onPauseAutoScroll = useCallback(() => {
    if (autoScrollResumeTimerRef.current)
      clearTimeout(autoScrollResumeTimerRef.current);
    setAutoScroll(false);
  }, []);

  const debouncedResumeAutoScroll = useMemo(() => {
    return () => {
      if (autoScrollResumeTimerRef.current)
        clearTimeout(autoScrollResumeTimerRef.current);
      autoScrollResumeTimerRef.current = setTimeout(
        () => setAutoScroll(true),
        500,
      );
    };
  }, []);
  //#endregion

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

    // Checks to see if we should auto-scroll.
    if (!listRef.current || !mounted || !autoScroll) return;
    // Scroll to active index.
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

  return (
    <FlatList
      ref={listRef}
      onLayout={onLayout}
      data={parsedLines}
      keyExtractor={(_, index) => `${index}`}
      renderItem={({ item, index }) => {
        const isLineActive = index === activeIndex;
        const positionMS = position * 1000;
        return (
          <StyledText bold className="text-xl text-onSurfaceVariant/50">
            {item.words.map((syncWord, wordIndex) => (
              <Text
                key={`${index}__${wordIndex}`}
                className={cn({
                  "text-onSurface":
                    isLineActive && syncWord.timeMS <= positionMS,
                })}
              >
                {syncWord.word}
              </Text>
            ))}
          </StyledText>
        );
      }}
      onScrollBeginDrag={onPauseAutoScroll}
      onScrollEndDrag={debouncedResumeAutoScroll}
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

//#region Lyric Parsing
const LRC_LINE = /^(\[[0-9]+:[0-9]+(?:\.[0-9]+)?\])+.*/;
const LRC_LINE_TIMESTAMP = /\[[0-9]+:[0-9]+(?:\.[0-9]+)?\]/g;
const LRC_WORD_LINE = /^(\<[0-9]+:[0-9]+(?:\.[0-9]+)?\>)+.*/;
const LRC_WORD_TIMESTAMP = /\<[0-9]+:[0-9]+(?:\.[0-9]+)?\>/g;
const LRC_TIMESTAMP = /[0-9]+/g;

type Timestamp = [string, string, ...string[]];

type SynchronizedWord = { timeMS: number; word: string };
type SynchronizedLine = { timeMS: number; words: SynchronizedWord[] };

function parseLines(lines: string[]): SynchronizedLine[] {
  const results: SynchronizedLine[] = [];
  for (const line of lines) {
    if (!line) continue;
    const lyricLineTimestampStr = line.match(LRC_LINE_TIMESTAMP);
    if (!lyricLineTimestampStr || lyricLineTimestampStr.length === 0) continue;

    // Get the time when the line will start.
    const lineTimeMS = getTimestampInMS(lyricLineTimestampStr[0]);
    const lyricLine = line.replace(LRC_LINE_TIMESTAMP, "").trim();

    // See if this has word-by-word synchronization.
    if (LRC_WORD_LINE.test(lyricLine)) {
      const wordTimestampStrs = lyricLine.match(LRC_WORD_TIMESTAMP);
      if (!wordTimestampStrs || wordTimestampStrs.length === 0) continue;
      // Get the words after each timestamp. In general, `wordTimestampStrs` &
      // `words` should have the same length.
      //  - Remove the 1st entry as it'll be an empty string.
      const words = line.split(LRC_WORD_TIMESTAMP).slice(1);

      const synchronizedWords: SynchronizedWord[] = wordTimestampStrs
        .map((wordTimestamp, index) => {
          const syncWord = words[index];
          if (syncWord === undefined) return;
          return {
            timeMS: getTimestampInMS(wordTimestamp),
            word: syncWord.trimStart(),
          };
        })
        .filter((syncWord) => syncWord !== undefined);

      results.push({ timeMS: lineTimeMS, words: synchronizedWords });
    } else {
      results.push({
        timeMS: lineTimeMS,
        words: [{ timeMS: lineTimeMS, word: lyricLine }],
      });
    }
  }

  return results;
}
//#endregion

//#region Helpers
function getTimestampInMS(timeString: string) {
  const [min, sec, ms = "0"] = timeString.match(LRC_TIMESTAMP) as Timestamp;
  return (
    Number.parseInt(min) * 60 * 1000 +
    Number.parseInt(sec) * 1000 +
    Number.parseInt(ms)
  );
}
//#endregion
//#endregion
