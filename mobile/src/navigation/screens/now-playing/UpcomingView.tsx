import { useQuery, useQueryClient } from "@tanstack/react-query";
import { inArray } from "drizzle-orm";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DragListRenderItemInfo } from "react-native-draglist/dist/FlashList";

import { tracks } from "~/db/schema";

import { Cached } from "~/resources/icons/Cached";
import { DragHandle } from "~/resources/icons/DragHandle";
import { getArtistsString } from "~/api/artist.utils";
import { getTracks } from "~/api/track";
import { playbackStore, usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls, Queue } from "~/stores/Playback/actions";

import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { cn } from "~/lib/style";
import { moveArray } from "~/utils/object";
import { wait } from "~/utils/promise";
import { FlashDragList } from "~/components/Defaults";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { RemovableItem } from "~/components/List/RemovableItem";
import { PlayingIndicator } from "~/modules/media/components/AnimatedBars";
import { SearchResult } from "~/modules/search/components/SearchResult";
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

  const onRemoveTrack = useCallback((key: string) => {
    Queue.removeKey(key);
    setCachedData((prev) => prev.filter((t) => t.key !== key));
  }, []);

  const onSynchronizeQueue = useCallback(async () => {
    setIsSynchronizing(true);
    // Clear the cache before we resynchronize the queue to prevent the potential
    // of removing the active track in the split frame where you could.
    setCachedData([]);
    await wait(1);
    await Queue.synchronize();
    // `removeQueries` will reset the `isPending` state unlike `resetQueries`.
    queryClient.removeQueries({ queryKey });
    setIsSynchronizing(false);
  }, [queryClient]);

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
        initialScrollIndex={listIndex}
        data={modifiedData}
        keyExtractor={(item) => item.key}
        estimatedItemSize={56}
        renderItem={(args) => (
          <RenderItem
            disableAfter={disableIndex}
            onRemoveTrack={onRemoveTrack}
            {...args}
          />
        )}
        onReordered={onMove}
        // FIXME: For some weird reason, we get double the margin bottom (should be `-mb-2`).
        className="-mb-1"
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
      <RemovableItem
        label={item.name}
        onRemove={() => onRemoveTrack(item.key)}
        disableRemove={item.active || info.isDragging}
        onPress={() =>
          item.active
            ? PlaybackControls.playToggle()
            : PlaybackControls.playAtIndex(index)
        }
        disabled={info.isDragging}
        className={cn(
          "mx-3 mb-2 flex-row items-center gap-1 rounded-xs active:bg-surfaceContainerLowest/50",
          {
            "bg-surfaceContainerLowest!": info.isActive,
            "opacity-25 active:opacity-100":
              index < disableAfter && !info.isActive,
          },
        )}
      >
        <SearchResult
          type="track"
          title={item.name}
          description={getArtistsString(item.tracksToArtists)}
          imageSource={item.artwork}
          LeftElement={item.active ? <PlayingIndicator /> : undefined}
          RightElement={
            <IconButton
              Icon={DragHandle}
              accessibilityLabel={t("template.entryMove", { name: item.name })}
              onPressIn={info.onDragStart}
              onPressOut={info.onDragEnd}
              disabled={info.isDragging && !info.isActive}
              size="xs"
            />
          }
          poppyLabel={item.active}
          className="shrink grow"
        />
      </RemovableItem>
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
