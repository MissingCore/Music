import { useTranslation } from "react-i18next";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import TrackPlayer from "react-native-track-player";

import { getTrackCover } from "~/db/utils";

import { Remove } from "~/icons/Remove";
import { SlowMotionVideo } from "~/icons/SlowMotionVideo";
import { VolumeUp } from "~/icons/VolumeUp";
import { Queue, useMusicStore } from "~/modules/media/services/Music";
import {
  sessionPreferencesStore,
  useSessionPreferencesStore,
} from "~/services/SessionPreferences";
import { useUpcomingStore } from "./helpers/UpcomingStore";

import { Colors } from "~/constants/Styles";
import { cn } from "~/lib/style";
import { FlashList } from "~/components/Defaults";
import { IconButton } from "~/components/Form/Button";
import { NSlider } from "~/components/Form/Slider";
import type { TrueSheetRef } from "~/components/Sheet";
import { Sheet } from "~/components/Sheet";
import { Swipeable } from "~/components/Swipeable";
import { SearchResult } from "~/modules/search/components/SearchResult";

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
  const playbackSpeed = useSessionPreferencesStore(
    (state) => state.playbackSpeed,
  );
  const volume = useSessionPreferencesStore((state) => state.volume);

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
    sessionPreferencesStore.setState({ playbackSpeed });
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
    sessionPreferencesStore.setState({ volume });
    await TrackPlayer.setVolume(volume).catch();
  },
  formatValue: (volume: number) => `${Math.round(volume * 100)}%`,
};
//#endregion
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
      <GestureHandlerRootView>
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
                className={cn("px-4", {
                  "opacity-25": index >= disableIndex,
                  "mt-1": index > 0,
                })}
              />
            ) : null
          }
          ListHeaderComponent={<QueueList />}
          isPending={trackList.length === 0}
          nestedScrollEnabled
          contentContainerClassName="pb-4"
        />
      </GestureHandlerRootView>
    </Sheet>
  );
}

/**
 * Separate component to render the queue list to optimize recycling
 * in the main list.
 */
function QueueList() {
  const { t } = useTranslation();
  const queueList = useUpcomingStore((state) => state.queuedTrackList);

  if (queueList.filter((t) => t !== undefined).length === 0) return null;

  return (
    <FlashList
      estimatedItemSize={52} // 48px Height + 4px Margin Bottom
      data={queueList}
      keyExtractor={(item, index) => `${item?.name}_${index}`}
      renderItem={({ item, index }) =>
        item ? (
          <Swipeable
            containerClassName="mb-1 px-4"
            renderRightActions={() => (
              <IconButton
                accessibilityLabel={t("template.entryRemove", {
                  name: item.name,
                })}
                onPress={() => Queue.removeAtIndex(index)}
                className="mr-4 bg-red"
              >
                <Remove color={Colors.neutral100} />
              </IconButton>
            )}
          >
            <TrackItem
              title={item.name}
              description={item.artistName ?? "—"}
              imageSource={getTrackCover(item)}
              inQueue
            />
          </Swipeable>
        ) : null
      }
    />
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
