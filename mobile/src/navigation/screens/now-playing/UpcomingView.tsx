import type { ListRenderItemInfo } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { inArray } from "drizzle-orm";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { tracks } from "~/db/schema";
import { getTrackCover } from "~/db/utils";

import { Delete } from "~/resources/icons/Delete";
import { getTracks } from "~/api/track";
import { playbackStore, usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls, Queue } from "~/stores/Playback/actions";

import { Colors } from "~/constants/Styles";
import { cn } from "~/lib/style";
import { FlashList } from "~/components/Defaults";
import { Swipeable } from "~/components/Swipeable";
import { PlayingIndicator } from "~/modules/media/components/AnimatedBars";
import { SearchResult } from "~/modules/search/components/SearchResult";
import { RepeatModes } from "~/stores/Playback/constants";
import {
  ContentPlaceholder,
  PagePlaceholder,
} from "../../components/Placeholder";

export default function Upcoming() {
  const { isPending, error, data } = useQueueTracks();
  const listIndex = usePlaybackStore((s) => s.queuePosition);
  const repeat = usePlaybackStore((s) => s.repeat);
  const [cachedData, setCachedData] = useState<TrackData[]>([]);

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

  const onRemoveAtIndex = useCallback((index: number) => {
    Queue.removeAtIndex(index);
    setCachedData((prev) => prev.toSpliced(index, 1));
  }, []);

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;

  // Index where the tracks won't be played.
  const disableIndex = repeat === RepeatModes.NO_REPEAT ? listIndex : 0;

  return (
    <FlashList
      estimatedItemSize={56} // 48px Height + 8px Margin Top
      initialScrollIndex={listIndex}
      estimatedFirstItemOffset={8}
      data={modifiedData}
      keyExtractor={(item) => `${item.id}_${item.instance}`}
      renderItem={(args) => (
        <RenderItem
          disableAfter={disableIndex}
          onRemoveAtIndex={onRemoveAtIndex}
          {...args}
        />
      )}
      ListEmptyComponent={<ContentPlaceholder isPending={data.length === 0} />}
      nestedScrollEnabled
      contentContainerClassName="py-4"
    />
  );
}

//#region Rendered Track
type RenderItemProps = ListRenderItemInfo<TrackData> & {
  disableAfter: number;
  onRemoveAtIndex: (index: number) => void;
};

const RenderItem = memo(function RenderItem({
  item,
  index,
  disableAfter,
  onRemoveAtIndex,
}: RenderItemProps) {
  if (!item) return null;

  if (item.active) {
    return (
      <TrackItem
        item={item}
        LeftElement={<PlayingIndicator />}
        className={cn("mx-4", { "mt-2": index > 0 })}
      />
    );
  }

  return (
    <Swipeable
      onSwipeLeft={() => onRemoveAtIndex(index)}
      RightIcon={<Delete color={Colors.neutral100} />}
      rightIconContainerClassName="rounded-sm bg-red"
      wrapperClassName={cn("mx-4", { "mt-2": index > 0 })}
      className="rounded-sm bg-canvas"
    >
      <TrackItem
        item={item}
        onPress={() => PlaybackControls.playAtIndex(index)}
        className={cn({ "opacity-25": index < disableAfter })}
      />
    </Swipeable>
  );
});

function TrackItem({
  item: { active, ...item },
  className,
  ...props
}: {
  item: TrackData;
  onPress?: VoidFunction;
  /** If we have a `LeftElement`, it means this track is active. */
  LeftElement?: SearchResult.Props["LeftElement"];
  className: string;
}) {
  return (
    // @ts-expect-error - Valid conditional use of `onPress`.
    <SearchResult
      as={active ? "default" : "ripple"}
      type="track"
      title={item.name}
      description={item.artistName ?? "—"}
      imageSource={getTrackCover(item)}
      poppyLabel={active}
      className={cn("pr-6", className)}
      {...props}
    />
  );
}
//#endregion

//#region Data Query
type TrackData = Awaited<ReturnType<typeof getQueueTracks>>[number];

async function getQueueTracks() {
  const { queue } = playbackStore.getState();
  if (queue.length === 0) return [];

  // Since there's potentially duplicate tracks.
  const queueSet = new Set(queue);
  const unorderedTracks = await getTracks({
    where: [inArray(tracks.id, [...queueSet])],
    columns: ["id", "name", "artistName", "artwork"],
    albumColumns: ["artwork"],
  });

  // Structure as a map for faster searching.
  const trackMap = Object.fromEntries(
    unorderedTracks.filter((t) => t !== undefined).map((t) => [t.id, t]),
  );
  const instanceCountMap = Object.fromEntries(
    Object.keys(trackMap).map((id) => [id, 0]),
  );

  // Ensure all the tracks exist.
  const trackList: Array<
    (typeof unorderedTracks)[number] & { instance: number; active?: boolean }
  > = [];
  const missingTracks: string[] = [];
  for (const tId of queue) {
    if (trackMap[tId]) {
      trackList.push({ ...trackMap[tId], instance: instanceCountMap[tId]! });
      instanceCountMap[tId]! += 1;
    } else missingTracks.push(tId);
  }
  Queue.removeIds(missingTracks);

  return trackList;
}

const queryKey = ["queue"];

function useQueueTracks() {
  return useQuery({
    queryKey,
    queryFn: getQueueTracks,
    gcTime: 0,
    staleTime: 0,
  });
}
//#endregion
