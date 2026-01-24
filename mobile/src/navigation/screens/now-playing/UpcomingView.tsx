import type { FlashListRef } from "@shopify/flash-list";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { inArray } from "drizzle-orm";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { DragListRenderItemInfo } from "react-native-draglist/dist/FlashList";

import { tracks } from "~/db/schema";

import { Cached } from "~/resources/icons/Cached";
import { Close } from "~/resources/icons/Close";
import { DragHandle } from "~/resources/icons/DragHandle";
import { getArtistsString } from "~/api/artist.utils";
import { getTracks } from "~/api/track";
import { getTrackArtwork } from "~/api/track.utils";
import { playbackStore, usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls, Queue } from "~/stores/Playback/actions";

import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { cn } from "~/lib/style";
import { debounceWithAccumulation } from "~/utils/debounce";
import { moveArray } from "~/utils/object";
import { wait } from "~/utils/promise";
import { FlashDragList } from "~/components/Defaults";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { StyledText } from "~/components/Typography/StyledText";
import { PlayingIndicator } from "~/modules/media/components/AnimatedBars";
import { MediaImage } from "~/modules/media/components/MediaImage";
import { RepeatModes } from "~/stores/Playback/constants";
import { extractTrackId } from "~/stores/Playback/utils";

export default function Upcoming() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { isPending, error, data } = useQueueTracks();
  const listIndex = usePlaybackStore((s) => s.queuePosition);
  const repeat = usePlaybackStore((s) => s.repeat);
  const [cachedData, setCachedData] = useState<TrackData[]>([]);
  const [isSynchronizing, setIsSynchronizing] = useState(false);

  const [restoredInitPos, setRestoredInitPos] = useState(false);
  const listRef = useRef<FlashListRef<any>>(null);

  // Sync our local state with the store data (this should be called twice
  // since we won't revalidate the query on changes).
  useEffect(() => {
    if (data) setCachedData(data);
  }, [data]);

  const modifiedData = useMemo(() => {
    if (cachedData.length === 0) return [];
    const activeTrack = cachedData[listIndex];
    if (!activeTrack) return cachedData;
    return cachedData.toSpliced(listIndex, 1, { ...activeTrack, active: true });
  }, [cachedData, listIndex]);

  const onMove = useCallback((fromIndex: number, toIndex: number) => {
    Queue.moveTrack(fromIndex, toIndex);
    setCachedData((prev) => moveArray(prev, { fromIndex, toIndex }));
  }, []);

  const onRemoveTrack = useMemo(
    () =>
      debounceWithAccumulation((tKeys: string[]) => {
        const keySet = new Set(tKeys);
        Queue.removeKeys(keySet);
        setCachedData((prev) => prev.filter((t) => !keySet.has(t.key)));
      }),
    [],
  );

  const onSynchronizeQueue = useCallback(async () => {
    setIsSynchronizing(true);
    await wait(1);
    await Queue.synchronize();
    // `removeQueries` will reset the `isPending` state unlike `resetQueries`.
    queryClient.removeQueries({ queryKey });
    setIsSynchronizing(false);
    setRestoredInitPos(false);
  }, [queryClient]);

  //! Manually scroll to active track as `initialScrollIndex` can throw
  //! the `index out of bounds, not enough layouts` error in the following
  //! conditions:
  //! - Some tracks have been removed, the last track is active, and we
  //!   trigger a reset.
  const scrollToActiveTrack = useCallback(() => {
    if (restoredInitPos) return;
    if (data?.length === 0 || listIndex >= (data?.length || -1)) return;
    //! We need to animate the `scrollToIndex` as otherwise, we dragging an item
    //! will be against an unscrolled list as `react-native-draglist` has calculations
    //! based on how much we scrolled, which setting `animated = false` will hide.
    listRef.current?.scrollToIndex({ index: listIndex, animated: true });
    setRestoredInitPos(true);
  }, [data, listIndex, restoredInitPos]);

  if (isPending || error || data.length === 0) {
    return <PagePlaceholder isPending={isPending || data?.length === 0} />;
  }

  // Index where the tracks won't be played.
  const disableIndex = repeat === RepeatModes.NO_REPEAT ? listIndex : 0;

  return (
    <>
      <ScreenOptions
        headerRight={() => (
          <FilledIconButton
            Icon={Cached}
            accessibilityLabel={t("form.reset")}
            onPress={onSynchronizeQueue}
            disabled={isSynchronizing}
            size="sm"
          />
        )}
      />
      <FlashDragList
        // @ts-expect-error - Ref is compatible.
        ref={listRef}
        //? Reliable method of triggering function when items are rendered.
        onContentSizeChange={scrollToActiveTrack}
        data={modifiedData}
        keyExtractor={(item) => item.key}
        estimatedItemSize={48}
        gap={8}
        renderItem={(args) => (
          <RenderItem
            disableAfter={disableIndex}
            onRemoveTrack={onRemoveTrack}
            {...args}
          />
        )}
        onReordered={onMove}
        contentContainerClassName="py-4"
      />
    </>
  );
}

//#region Rendered Track
type RenderItemProps = DragListRenderItemInfo<TrackData> & {
  disableAfter: number;
  onRemoveTrack: (tKey: string) => void;
};

const RenderItem = memo(
  function RenderItem({
    item,
    index,
    disableAfter,
    onRemoveTrack,
    ...info
  }: RenderItemProps) {
    const { t } = useTranslation();
    return (
      <Pressable
        onPress={() => PlaybackControls.playAtIndex(index)}
        className={cn(
          "mx-2 flex-row items-center gap-1 rounded-xs active:bg-surfaceContainerLowest/50",
          {
            "mt-2": index > 0,
            "bg-surfaceContainerLowest!": info.isActive,
            "opacity-25 active:opacity-100":
              index < disableAfter && !info.isActive,
          },
        )}
      >
        <IconButton
          Icon={DragHandle}
          accessibilityLabel={t("template.entryMove", { name: item.name })}
          onPressIn={info.onDragStart}
          onPressOut={info.onDragEnd}
          disabled={info.isDragging && !info.isActive}
          size="sm"
        />
        <View className="shrink grow flex-row items-center gap-2">
          {item.active ? (
            <PlayingIndicator />
          ) : (
            <MediaImage
              type="track"
              size={48}
              source={getTrackArtwork(item)}
              className="rounded-xs"
            />
          )}
          <View className="shrink grow gap-0.5 pr-2">
            <StyledText
              numberOfLines={1}
              className={cn("text-sm", { "text-primary": item.active })}
            >
              {item.name}
            </StyledText>
            <StyledText
              numberOfLines={1}
              className="text-xs text-onSurfaceVariant"
            >
              {getArtistsString(item.tracksToArtists)}
            </StyledText>
          </View>
        </View>
        {item.active ? (
          <View className="size-10" />
        ) : (
          <IconButton
            Icon={Close}
            accessibilityLabel={t("template.entryRemove", { name: item.name })}
            onPress={() => onRemoveTrack(item.key)}
            disabled={info.isDragging}
            size="sm"
          />
        )}
      </Pressable>
    );
  },
  (oldProps, newProps) => {
    return (
      (["index", "isActive", "isDragging", "disableAfter"] as const).every(
        (key) => oldProps[key] === newProps[key],
      ) &&
      oldProps.item.key === newProps.item.key &&
      oldProps.item.active === newProps.item.active
    );
  },
);
//#endregion

//#region Data Query
type TrackData = Awaited<ReturnType<typeof getQueueTracks>>[number];

async function getQueueTracks() {
  const { queue } = playbackStore.getState();
  if (queue.length === 0) return [];

  // Since there's potentially duplicate tracks.
  const queueTrackIds = queue.map(extractTrackId);
  const queueSet = new Set(queueTrackIds);
  const unorderedTracks = await getTracks({
    where: [inArray(tracks.id, [...queueSet])],
    columns: ["id", "name", "artwork"],
    albumColumns: ["artwork"],
  });

  // Structure as a map for faster searching.
  const trackMap = Object.fromEntries(
    unorderedTracks.filter((t) => t !== undefined).map((t) => [t.id, t]),
  );

  // Ensure all the tracks exist.
  const trackList: Array<
    (typeof unorderedTracks)[number] & { key: string; active?: boolean }
  > = [];
  const missingTracks: string[] = [];
  queueTrackIds.forEach((tId, index) => {
    if (trackMap[tId]) trackList.push({ ...trackMap[tId], key: queue[index]! });
    else missingTracks.push(tId);
  });
  await Queue.removeIds(missingTracks);

  return trackList;
}

const queryKey = ["now-playing", "queue"];

function useQueueTracks() {
  return useQuery({
    queryKey,
    queryFn: getQueueTracks,
    gcTime: 0,
    staleTime: 0,
  });
}
//#endregion
