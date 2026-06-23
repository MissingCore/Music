import { useNavigation } from "@react-navigation/native";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { usePolledProgress } from "react-native-audio-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLyricForTrack } from "~/data/lyric/queries";
import { PlaybackControls } from "~/stores/Playback/actions";
import { usePreferenceStore } from "~/stores/Preference/store";

import { cn } from "~/lib/style";
import { bgWait } from "~/utils/promise";
import type { FlatListProps, FlatListRef } from "~/components/Base/List";
import { FlatList, useFlatListRef } from "~/components/Base/List";
import { Pressable } from "~/components/Base/Pressable";
import { ExtendedTButton } from "~/components/Form/Button";
import { IconButton } from "~/components/Form/Button/Icon";
import { TopDownGradient } from "~/components/Gradient";
import { Em, TEm } from "~/components/Typography/StyledText";
import { useTheme } from "~/modules/customization/theme/hooks";
import { autoDiscoverLyrics } from "../helpers/autoDiscoverLyrics";
import { removeSynchronizedLyricsJunk } from "../helpers/cleanUpLyricsJunk";

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
  const cleanupInProgress = useRef<Set<string>>(new Set());

  const lyricsLines = useMemo(() => {
    if (!data?.lyrics) return [];
    return data.lyrics.split("\n").map((line) => line.trim());
  }, [data?.lyrics]);

  const isSynchronized = useMemo(
    () =>
      lyricsLines.every((line) =>
        !line ? true : LRC_LINE_SYNC_TAG.test(line),
      ),
    [lyricsLines],
  );

  //! TODO: Remove in `v4.0.0`.
  //! Temporary "hack" to clean up cached lyrics with "junk" in front, which
  //! was fixed in `v3.3.0`.
  useEffect(() => {
    if (isSynchronized || !data?.id || lyricsLines.length === 0) return;
    if (cleanupInProgress.current.has(data.id)) return;
    cleanupInProgress.current.add(data.id);
    removeSynchronizedLyricsJunk(data.id)
      .catch((err) => console.log(`[LRC_CLEANUP_ERR]`, err))
      .finally(() => cleanupInProgress.current.delete(data.id));
  }, [props.trackId, data?.id, lyricsLines, isSynchronized]);

  if (isPending) return null;
  else if (error || !data) {
    return <LyricsNotFound key={props.trackId} {...props} />;
  }

  return (
    <>
      {isSynchronized ? (
        <SynchronizedLyrics
          key={props.trackId}
          lines={lyricsLines}
          offset={props.offset}
        />
      ) : (
        <FlatList
          data={lyricsLines}
          keyExtractor={(_, index) => `${index}`}
          renderItem={({ item }) => <Em className="text-xl">{item}</Em>}
          contentContainerStyle={{
            paddingTop: props.offset,
            paddingBottom: SCROLL_OFFSET,
            gap: LINE_GAP,
          }}
        />
      )}

      <IconButton
        icon="edit"
        accessibilityLabel={t("form.edit")}
        onPress={() => navigation.navigate("ModifyLyric", { id: data.id })}
        className="absolute right-0 bottom-0 z-100"
        size="xs"
      />
    </>
  );
}

//#region Not Found
function LyricsNotFound(props: { trackId: string; offset: number }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [checkingEmbeddedLyrics, setCheckingEmbeddedLyrics] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      await autoDiscoverLyrics(controller);
      await bgWait(250);
      setCheckingEmbeddedLyrics(false);
    })();

    return () => controller.abort();
  }, []);

  return (
    <View
      style={{ paddingTop: props.offset }}
      className="items-center gap-6 pb-4"
    >
      <TEm textKey="err.msg.noLyrics" className="text-xl" />
      <ExtendedTButton
        // @ts-expect-error - Will display text if key doesn't exist.
        textKey={t("template.entryManage", { name: t("feat.lyrics.title") })}
        onPress={() => navigation.navigate("Lyrics", { linkTo: props.trackId })}
        disabled={checkingEmbeddedLyrics}
        className="min-h-auto w-full max-w-48"
        textClassName="text-xs"
      />
    </View>
  );
}
//#endregion

//#region Synchronized Lyrics
function SynchronizedLyrics(props: { lines: string[]; offset: number }) {
  // Use `usePolledProgress` as `Event.PlaybackProgressUpdated` fires once a second.
  const { position } = usePolledProgress(50, false);
  const listRef = useFlatListRef();
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const prevActiveLineIndex = useRef(-1);
  const [inActiveWordStartIndex, setInActiveWordStartIndex] = useState(0);

  const parsedLines = useMemo(() => parseLines(props.lines), [props.lines]);

  //#region Auto Scroll
  const autoScrollResumeTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [autoScroll, setAutoScroll] = useState(false);

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

  //? Delay scroll to active line on mount because sometimes it doesn't work due to
  //? timings, which is noticeable due to our `scrollToIndex` spam-prevention logic.
  useEffect(() => {
    debouncedResumeAutoScroll();
  }, [debouncedResumeAutoScroll]);

  useEffect(() => {
    // Calculate active index.
    const positionMS = position * 1000;
    const numLines = parsedLines.length;
    let newIndex = -1;
    for (let i = 0; i < numLines; i++) {
      if (parsedLines[i]!.timeMS > positionMS) break;
      newIndex += 1;
    }
    setActiveLineIndex(newIndex);
    if (newIndex !== -1) {
      setInActiveWordStartIndex(
        parsedLines[newIndex]!.words.findIndex(
          ({ timeMS }) => timeMS > positionMS,
        ),
      );
    }

    // Checks to see if we should auto-scroll.
    if (!listRef.current || !autoScroll) return;
    // Scroll to active index.
    if (newIndex === -1) {
      listRef.current.scrollToOffset({ offset: 0 });
      return;
    }
    // Prevent spamming `scrollToOffset` due to having a significantly
    // smaller update interval.
    if (newIndex === prevActiveLineIndex.current) return;
    prevActiveLineIndex.current = newIndex;
    listRef.current.scrollToIndex({
      index: newIndex,
      viewOffset: (SCROLL_OFFSET + LINE_GAP) / 2,
      viewPosition: 0.5,
    });
  }, [listRef, parsedLines, position, autoScroll]);

  // Pre-format the rendered content so that we don't recalculate this
  // on every render.
  const renderedLines = useMemo(
    () =>
      parsedLines.map(({ timeMS, words }, index) => ({
        timeMS,
        line:
          index !== activeLineIndex
            ? words.reduce((prev, { word }) => prev + word, "")
            : words.reduce(
                (prev, { word }, index) => {
                  if (
                    inActiveWordStartIndex === -1 ||
                    index < inActiveWordStartIndex
                  ) {
                    prev[0] += word;
                  } else prev[1] += word;
                  return prev;
                },
                ["", ""] as [string, string],
              ),
      })),
    [parsedLines, activeLineIndex, inActiveWordStartIndex],
  );

  return (
    <MemoLyricList
      ref={listRef}
      data={renderedLines}
      //? Force all items to render, allowing `scrollToIndex` to work.
      initialNumToRender={renderedLines.length}
      onScrollBeginDrag={onPauseAutoScroll}
      onScrollEndDrag={debouncedResumeAutoScroll}
      offset={props.offset}
    />
  );
}

//#region Memoized Lyric List
type FormattedSynchronizedLine = {
  timeMS: number;
  line: string | [string, string];
};

const MemoLyricList = memo(
  function MemoLyricList(
    props: Omit<FlatListProps<FormattedSynchronizedLine>, "renderItem"> & {
      ref: FlatListRef<FormattedSynchronizedLine>;
      offset: number;
    },
  ) {
    return (
      <FlatList
        {...props}
        keyExtractor={(_, index) => `${index}`}
        renderItem={({ item: { timeMS, line } }) => {
          if (typeof line === "string") {
            return (
              <Pressable onPress={() => PlaybackControls.seekTo(timeMS / 1000)}>
                <Em className="text-xl text-onSurfaceVariant/50">{line}</Em>
              </Pressable>
            );
          } else {
            return (
              <Em className="text-xl">
                {line[0]}
                {line[1].length > 0 && (
                  <Text className="text-onSurfaceVariant/50">{line[1]}</Text>
                )}
              </Em>
            );
          }
        }}
        // Suppresses error when `scrollToIndex` fails.
        onScrollToIndexFailed={() => {}}
        contentContainerStyle={{
          paddingTop: props.offset,
          paddingBottom: SCROLL_OFFSET,
          gap: LINE_GAP,
        }}
      />
    );
  },
  // We should only re-render the list when `data` or `offset` changes.
  (prevProps, nextProps) =>
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
    prevProps.offset === nextProps.offset,
);
//#endregion

//#region Lyric Parsing
const LRC_LINE_SYNC_TAG = /^\[.+:.+?\]/;
const LRC_LINE_START_TIMESTAMP = /^\[[0-9]+:[0-9]+(?:\.[0-9]+)?\]/;
/** Supports both square & angle bracket format. */
const LRC_WORD_TIMESTAMP = /(?:\[|<)[0-9]+:[0-9]+(?:\.[0-9]+)?(?:\]|>)/g;
const LRC_TIMESTAMP = /[0-9]+/g;

type Timestamp = [string, string, ...string[]];

type SynchronizedWord = { timeMS: number; word: string };
type SynchronizedLine = { timeMS: number; words: SynchronizedWord[] };

function parseLines(lines: string[]): SynchronizedLine[] {
  const results: SynchronizedLine[] = [];
  for (const line of lines) {
    if (!line) continue;
    const lyricLineTimestampStr = line.match(LRC_LINE_START_TIMESTAMP);
    if (!lyricLineTimestampStr || lyricLineTimestampStr.length === 0) continue;

    // Get the time when the line will start.
    const lineTimeMS = getTimestampInMS(lyricLineTimestampStr[0]);
    const lyricLine = line.replace(LRC_LINE_START_TIMESTAMP, "").trim();

    // See if this has word-by-word synchronization.
    if (LRC_WORD_TIMESTAMP.test(lyricLine)) {
      const wordTimestampStrs = lyricLine.match(LRC_WORD_TIMESTAMP);
      if (!wordTimestampStrs || wordTimestampStrs.length === 0) continue;
      // Get the words after each timestamp. In general, `wordTimestampStrs` &
      // `words` should have the same length.
      const [lineFirstWord, ...words] = lyricLine.split(LRC_WORD_TIMESTAMP);

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

      // Assign the first word (could be an empty string) the line's timestamp.
      if (typeof lineFirstWord === "string") {
        synchronizedWords.unshift({ timeMS: lineTimeMS, word: lineFirstWord });
      }

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
