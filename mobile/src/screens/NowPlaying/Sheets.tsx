import type { ListRenderItemInfo } from "@shopify/flash-list";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import TrackPlayer from "@weights-ai/react-native-track-player";

import { getTrackCover } from "~/db/utils";

import { Remove } from "~/icons/Remove";
import { SlowMotionVideo } from "~/icons/SlowMotionVideo";
import { VolumeUp } from "~/icons/VolumeUp";
import { Queue, useMusicStore } from "~/modules/media/services/Music";
import { sessionStore, useSessionStore } from "~/services/SessionStore";
import type { UpcomingStore } from "./helpers/UpcomingStore";
import { useUpcomingStore } from "./helpers/UpcomingStore";

import { Colors } from "~/constants/Styles";
import { cn } from "~/lib/style";
import { FlashList } from "~/components/Defaults";
import { Button } from "~/components/Form/Button";
import { NSlider } from "~/components/Form/Slider";
import type { TrueSheetRef } from "~/components/Sheet";
import { Sheet } from "~/components/Sheet";
import { Swipeable, useSwipeableRef } from "~/components/Swipeable";
import { ContentPlaceholder } from "~/components/Transition/Placeholder";
import { SearchResult } from "~/modules/search/components/SearchResult";

type PartialTrack = UpcomingStore["currentTrackList"][0];

/** All the sheets used on `/now-playing` route. */
export function NowPlayingSheets(
  props: Record<"playbackOptionsRef" | "upcomingTracksRef", TrueSheetRef>,
) {
  return (
    <>
      <PlaybackOptionsSheet sheetRef={props.playbackOptionsRef} />
      <TrackUpcomingSheet sheetRef={props.upcomingTracksRef} />
    </>
  );
}

//#region Playback Options
/** Enables us to specify  how the media is played. */
function PlaybackOptionsSheet(props: { sheetRef: TrueSheetRef }) {
  const { t } = useTranslation();
  const playbackSpeed = useSessionStore((state) => state.playbackSpeed);
  const volume = useSessionStore((state) => state.volume);

  return (
    <Sheet ref={props.sheetRef} contentContainerClassName="gap-4">
      <NSlider
        label={t("feat.playback.extra.speed")}
        value={playbackSpeed}
        {...PlaybackSpeedSliderOptions}
      />
      <NSlider
        label={t("feat.playback.extra.volume")}
        value={volume}
        {...VolumeSliderOptions}
      />
    </Sheet>
  );
}

const rateFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const PlaybackSpeedSliderOptions = {
  min: 0.25,
  max: 2,
  step: 0.05,
  trackMarks: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
  icon: <SlowMotionVideo />,
  onChange: async (playbackSpeed: number) => {
    sessionStore.setState({ playbackSpeed });
    await TrackPlayer.setRate(playbackSpeed).catch();
  },
  formatValue: (playbackSpeed: number) =>
    `${rateFormatter.format(playbackSpeed)}x`,
};

const VolumeSliderOptions = {
  min: 0,
  max: 1,
  step: 0.01,
  trackMarks: [0, 0.25, 0.5, 0.75, 1],
  icon: <VolumeUp />,
  onChange: async (volume: number) => {
    sessionStore.setState({ volume });
    await TrackPlayer.setVolume(volume).catch();
  },
  formatValue: (volume: number) => `${Math.round(volume * 100)}%`,
};
//#endregion

//#region Upcoming Tracks
/** Enables user to see what tracks are coming up and remove tracks from the queue. */
function TrackUpcomingSheet(props: { sheetRef: TrueSheetRef }) {
  const populateCurrentTrackList = useUpcomingStore(
    (state) => state.populateCurrentTrackList,
  );
  const trackList = useUpcomingStore((state) => state.currentTrackList);
  const listIndex = useMusicStore((state) => state.listIdx);
  const repeat = useMusicStore((state) => state.repeat);

  // Get the tracks that'll be rendered.
  const data = [
    ...trackList.slice(listIndex + 1),
    ...trackList.slice(0, listIndex + 1),
  ];
  // Index where the tracks won't be played.
  const disableIndex =
    repeat !== "no-repeat"
      ? trackList.length
      : trackList.length - 1 - listIndex;

  return (
    <Sheet
      ref={props.sheetRef}
      titleKey="term.upcoming"
      snapTop
      onPresent={populateCurrentTrackList}
      contentContainerClassName="px-0"
    >
      <FlashList
        estimatedItemSize={52} // 48px Height + 4px Margin Top
        data={data}
        keyExtractor={(item, index) => (item ? item.id : `${index}`)}
        renderItem={({ item, index }) =>
          item ? (
            <TrackItem
              title={item.name}
              description={item.artistName ?? "—"}
              imageSource={getTrackCover(item)}
              className={cn({
                "opacity-25": index >= disableIndex,
                "mt-1": index > 0,
              })}
            />
          ) : null
        }
        ListHeaderComponent={<QueueList />}
        ListEmptyComponent={
          <ContentPlaceholder isPending={trackList.length === 0} />
        }
        ListHeaderComponentStyle={{ marginHorizontal: -16 }}
        nestedScrollEnabled
        contentContainerClassName="px-4 pb-4"
      />
    </Sheet>
  );
}

/**
 * Separate component to render the queue list to optimize recycling
 * in the main list.
 */
function QueueList() {
  const queueList = useUpcomingStore((state) => state.queuedTrackList);
  if (queueList.filter((t) => t !== undefined).length === 0) return null;
  return (
    <FlashList
      estimatedItemSize={52} // 48px Height + 4px Margin Bottom
      data={queueList}
      keyExtractor={(item, index) => `${item?.id}_${index}`}
      renderItem={(args) => <RenderQueueItem {...args} />}
    />
  );
}

function RenderQueueItem({ item, index }: ListRenderItemInfo<PartialTrack>) {
  const { t } = useTranslation();
  const swipeableRef = useSwipeableRef();
  const [lastItemId, setLastItemId] = useState(item?.id);

  if (item?.id !== lastItemId) {
    setLastItemId(item?.id);
    if (swipeableRef.current) swipeableRef.current.resetIfNeeded();
  }

  if (!item) return null;
  return (
    <Swipeable
      // @ts-expect-error - Error assigning ref to class component.
      ref={swipeableRef}
      containerClassName="mb-1 px-4"
      renderRightActions={() => (
        <Button
          accessibilityLabel={t("template.entryRemove", { name: item.name })}
          onPress={() => Queue.removeAtIndex(index)}
          className="mr-4 bg-red p-3"
        >
          <Remove color={Colors.neutral100} />
        </Button>
      )}
    >
      <TrackItem
        title={item.name}
        description={item.artistName ?? "—"}
        imageSource={getTrackCover(item)}
        inQueue
      />
    </Swipeable>
  );
}

/**
 * Essentially `<Track />` without any playing functionality. Has special
 * behavior if the rendered track is part of the queue.
 */
function TrackItem({
  inQueue,
  ...props
}: Pick<
  SearchResult.Content,
  "title" | "description" | "imageSource" | "className"
> & { inQueue?: boolean }) {
  return (
    <SearchResult
      type="track"
      {...props}
      contentLabel={inQueue ? "Q" : undefined}
      className={cn(props.className, "bg-canvasAlt pr-2", { "pr-6": !inQueue })}
    />
  );
}
//#endregion
