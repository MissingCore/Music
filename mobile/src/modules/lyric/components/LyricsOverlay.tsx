// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import {
  createContext,
  memo,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import type { ViewStyle } from "react-native";
import { Text as NativeText, View } from "react-native";
import { usePolledProgress } from "react-native-audio-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTrackLyrics } from "~/data/track/queries";
import { PlaybackControls } from "~/stores/Playback/actions";
import { useAlternativeLayout } from "~/hooks/useAlternativeLayout";
import { useLyricStore } from "../core/store";
import { toggleLyricStoreKey } from "../core/actions";

import { cn } from "~/lib/style";
import { bgWait } from "~/utils/promise";
import type { FlatListProps, FlatListRef } from "~/components/Base/List";
import { FlatList, useFlatListRef } from "~/components/Base/List";
import { TopDownGradient } from "~/components/Gradient";
import { IconButton } from "~/components/next/base/button-icon";
import { Text, TText } from "~/components/next/base/typography";
import { ActionButton } from "~/components/next/blocks/button-action";
import { Pressable } from "~/components/next/primitive/pressable";
import { useIsAtmosphereActive } from "~/modules/customization/atmosphere/store";
import { useTheme } from "~/modules/customization/theme/hooks";
import { autoDiscoverLyrics } from "../helpers/autoDiscoverLyrics";
import { parseLyrics } from "../helpers/parser";
import type { SynchronizedLine } from "../helpers/parser/utils";

const SCROLL_OFFSET = 64;
const LINE_GAP = 16;

interface LyricStyleContextValue {
  listStyles: ViewStyle;
  notFoundStyles: ViewStyle;
}

const LyricStyleContext = createContext<LyricStyleContextValue>(null as never);

export function LyricsOverlay(props: { height: number; trackId: string }) {
  const { top } = useSafeAreaInsets();
  const { scheme } = useTheme();
  const hideBackground = useIsAtmosphereActive();

  // Estimated offset to get overlay to go behind the `TopAppBar`.
  const scrollGradientHeight = top + SCROLL_OFFSET;

  const value = useMemo<LyricStyleContextValue>(
    () => ({
      listStyles: { paddingVertical: (props.height + top) / 2, gap: LINE_GAP },
      notFoundStyles: { paddingTop: top + SCROLL_OFFSET },
    }),
    [props.height, top],
  );

  return (
    <LyricStyleContext value={value}>
      <View
        style={{ top: -top, bottom: 0 }}
        className={cn(
          "absolute w-full items-center justify-center overflow-hidden",
          !hideBackground
            ? cn("bg-surface/85", { "bg-surface/60": scheme === "dark" })
            : undefined,
        )}
      >
        <LyricsContent trackId={props.trackId} />

        {!hideBackground ? (
          <>
            <TopDownGradient
              height={scrollGradientHeight}
              startFrom={top}
              className="absolute top-0 left-0"
            />
            <TopDownGradient
              height={scrollGradientHeight}
              className="absolute bottom-0 left-0 rotate-180"
            />
          </>
        ) : null}
      </View>
    </LyricStyleContext>
  );
}

function LyricsContent({ trackId }: { trackId: string }) {
  const { isPending, data, error } = useTrackLyrics(trackId);
  const { listStyles } = use(LyricStyleContext);

  const formattedLyrics = useMemo(() => {
    if (!data?.lyricText) return;
    return parseLyrics(data.lyricText);
  }, [data?.lyricText]);

  if (isPending) return null;
  else if (error || !data) {
    return <LyricsNotFound key={trackId} trackId={trackId} />;
  }
  return (
    <>
      {Array.isArray(formattedLyrics) ? (
        <SynchronizedLyrics key={trackId} parsedLines={formattedLyrics} />
      ) : (
        <FlatList
          data={formattedLyrics?.split("\n")}
          keyExtractor={(_, index) => `${index}`}
          renderItem={({ item }) => (
            <Text bold size="xl">
              {item}
            </Text>
          )}
          nestedScrollEnabled
          className="w-full"
          contentContainerStyle={listStyles}
          contentContainerClassName="px-4"
        />
      )}
      <ExtraActions trackId={data.trackId} />
    </>
  );
}

function ExtraActions({ trackId }: { trackId?: string }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const expandLyrics = useLyricStore((s) => s.fullscreen);

  return (
    <View className="absolute right-4 bottom-0 z-100 flex-row gap-2">
      <IconButton
        icon={expandLyrics ? "fullscreen-exit" : "fullscreen"}
        accessibilityLabel={t(`term.${expandLyrics ? "minimize" : "expand"}`)}
        onPress={toggleLyricStoreKey("fullscreen")}
        size="xs"
      />
      {trackId ? (
        <IconButton
          icon="edit"
          accessibilityLabel={t("form.edit")}
          onPress={() => navigation.navigate("LyricForm", { trackId })}
          size="xs"
        />
      ) : null}
    </View>
  );
}

//#region Not Found
function LyricsNotFound({ trackId }: { trackId: string }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [checkingEmbeddedLyrics, setCheckingEmbeddedLyrics] = useState(true);
  const { notFoundStyles } = use(LyricStyleContext);
  const isLargeScreen = useAlternativeLayout();

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
    <>
      <View
        style={!isLargeScreen ? notFoundStyles : undefined}
        className="my-auto items-center gap-6 pb-4"
      >
        <TText textKey="err.msg.noLyrics" bold size="xl" />
        <ActionButton
          label={t("template.entryManage", { name: t("feat.lyrics.title") })}
          onPress={() => navigation.navigate("LyricForm", { trackId })}
          disabled={checkingEmbeddedLyrics}
          className="w-full max-w-48 rounded-lg"
          labelClassName="text-xs"
        />
      </View>
      <ExtraActions />
    </>
  );
}
//#endregion

//#region Synchronized Lyrics
function SynchronizedLyrics({
  parsedLines,
}: {
  parsedLines: SynchronizedLine[];
}) {
  // Use `usePolledProgress` as `Event.PlaybackProgressUpdated` fires once a second.
  const { position } = usePolledProgress(50, false);
  const listRef = useFlatListRef();
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const prevActiveLineIndex = useRef(-1);
  const [inActiveWordStartIndex, setInActiveWordStartIndex] = useState(0);

  //#region Auto Scroll
  const [canEmitAutoScrollEvent, setCanEmitAutoScrollEvent] = useState(false);
  const canResumeTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const pauseAutoScroll = useCallback(() => {
    if (canResumeTimerRef.current) clearTimeout(canResumeTimerRef.current);
    setCanEmitAutoScrollEvent(false);
  }, []);

  const resumeAutoScroll = useMemo(() => {
    return () => {
      if (canResumeTimerRef.current) clearTimeout(canResumeTimerRef.current);
      canResumeTimerRef.current = setTimeout(() => {
        prevActiveLineIndex.current = -1;
        setCanEmitAutoScrollEvent(true);
      }, 500);
    };
  }, []);
  //#endregion

  //? Delay scroll to active line on mount because sometimes it doesn't work due to
  //? timings, which is noticeable due to our `scrollToIndex` spam-prevention logic.
  useEffect(() => {
    resumeAutoScroll();
  }, [resumeAutoScroll]);

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
    if (!listRef.current || !canEmitAutoScrollEvent) return;
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
  }, [listRef, parsedLines, position, canEmitAutoScrollEvent]);

  // Pre-format the rendered content so that we don't recalculate this
  // on every render.
  const cachedJoinedLines: FormattedSynchronizedLine[] = useMemo(
    () =>
      parsedLines.map(({ timeMS, words }) => ({
        timeMS,
        line: words.map(({ word }) => word).join(""),
      })),
    [parsedLines],
  );

  const renderedLines = useMemo(() => {
    const activeLine = parsedLines[activeLineIndex];
    if (activeLineIndex === -1 || activeLine === undefined)
      return cachedJoinedLines;

    const { timeMS, words } = activeLine;
    const formattedLine: [string, string] = ["", ""];
    words.forEach(({ word }, index) => {
      const hasSeen =
        inActiveWordStartIndex === -1 || index < inActiveWordStartIndex;
      formattedLine[hasSeen ? 0 : 1] += word;
    });

    const copiedJoinLines = [...cachedJoinedLines];
    copiedJoinLines[activeLineIndex] = { timeMS, line: formattedLine };
    return copiedJoinLines;
  }, [parsedLines, cachedJoinedLines, activeLineIndex, inActiveWordStartIndex]);

  return (
    <MemoLyricList
      ref={listRef}
      data={renderedLines}
      //? Force all items to render, allowing `scrollToIndex` to work.
      initialNumToRender={renderedLines.length}
      onMomentumScrollBegin={pauseAutoScroll}
      onMomentumScrollEnd={resumeAutoScroll}
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
    },
  ) {
    const { listStyles } = use(LyricStyleContext);
    return (
      <FlatList
        {...props}
        keyExtractor={(_, index) => `${index}`}
        renderItem={({ item: { timeMS, line } }) => {
          if (typeof line === "string") {
            return (
              <Pressable onPress={() => PlaybackControls.seekTo(timeMS / 1000)}>
                <Text bold size="xl" className="text-onSurfaceVariant/50">
                  {line}
                </Text>
              </Pressable>
            );
          } else {
            return (
              <Text bold size="xl">
                {line[0]}
                {line[1].length > 0 && (
                  <NativeText className="text-onSurfaceVariant/50">
                    {line[1]}
                  </NativeText>
                )}
              </Text>
            );
          }
        }}
        nestedScrollEnabled
        // Suppresses error when `scrollToIndex` fails.
        onScrollToIndexFailed={() => {}}
        className="w-full"
        contentContainerStyle={listStyles}
        contentContainerClassName="px-4"
      />
    );
  },
  // We should only re-render the list when `data` changes.
  (prevProps, nextProps) =>
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data),
);
//#endregion
