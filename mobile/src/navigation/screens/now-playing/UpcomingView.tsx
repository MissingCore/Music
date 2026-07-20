// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { DragListRenderItemInfo } from "@missingcore/ui/drag-list";
import { DragList, useDragListState } from "@missingcore/ui/drag-list";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { inArray } from "drizzle-orm";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { getArtistsString } from "~/data/artist/utils";
import { getTracks } from "~/data/track/api";
import { structuredTracksView } from "~/data/views";
import { playbackStore, usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls, Queue } from "~/stores/Playback/actions";

import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { TopAppBarTemplate } from "~/navigation/components/TopAppBar";

import { cn } from "~/lib/style";
import { moveArray } from "~/utils/object";
import { wait } from "~/utils/promise";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { RemovableItem } from "~/components/List/RemovableItem";
import { SafeContainer } from "~/components/SafeContainer";
import { PlayingIndicator } from "~/modules/media/components/AnimatedBars";
import { SearchResult } from "~/modules/search/components/SearchResult";
import { RepeatModes } from "~/stores/Playback/constants";
import { extractTrackId } from "~/stores/Playback/utils";

export default function Upcoming({ renderAsScreen = true }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { isPending, error, data } = useQueueTracks();
  const listIndex = usePlaybackStore((s) => s.queuePosition);
  const repeat = usePlaybackStore((s) => s.repeat);
  const [cachedData, setCachedData] = useState<TrackData[]>([]);
  const [isSynchronizing, setIsSynchronizing] = useState(false);

  // Populate `cachedData` (which we use to render as it's faster than waiting
  // for the query to update) whenever `useQueueTracks` updates (which is mainly
  // when we resynchronize the list).
  const prevData = useRef<TrackData[]>([]);
  if (data && prevData.current !== data) {
    prevData.current = data;
    setCachedData(data);
  }

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
    await wait(1);
    // Clear the cache before we resynchronize the queue to prevent the potential
    // of removing the active track in the split frame where you could.
    setCachedData([]);
    await Queue.synchronize();
    // `removeQueries` will reset the `isPending` state unlike `resetQueries`.
    queryClient.removeQueries({ queryKey });
    setIsSynchronizing(false);
  }, [queryClient]);

  // Index where the tracks won't be played.
  const disableIndex = repeat === RepeatModes.NO_REPEAT ? listIndex : 0;

  //#region Stable Callbacks
  const keyExtractor = useCallback(({ key }: { key: string }) => key, []);

  const renderItem = useCallback(
    (args: DragListRenderItemInfo<TrackData>) => (
      <RenderItem
        {...args}
        disableAfter={disableIndex}
        onRemove={onRemoveTrack}
      />
    ),
    [disableIndex, onRemoveTrack],
  );
  //#endregion

  const isDataPending = isPending || error || cachedData.length === 0;

  return (
    <SafeContainer
      className={cn("flex-1", {
        "max-w-96 min-w-80 bg-surfaceContainerLow": !renderAsScreen,
      })}
    >
      <TopAppBarTemplate
        title="term.upcoming"
        headerLeftAction={
          renderAsScreen ? (
            <FilledIconButton
              icon="arrow-back"
              accessibilityLabel={t("form.back")}
              onPress={() => navigation.goBack()}
              className="rtl:rotate-180"
            />
          ) : undefined
        }
        headerRightAction={
          <FilledIconButton
            icon="cached"
            accessibilityLabel={t("form.reset")}
            onPress={onSynchronizeQueue}
            disabled={isSynchronizing}
          />
        }
      />
      {isDataPending ? (
        <PagePlaceholder isPending={isPending || cachedData.length === 0} />
      ) : (
        <DragList
          initialScrollIndex={listIndex}
          estimatedItemSize={56}
          data={modifiedData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onReordered={onMove}
          className="-mb-2"
          contentContainerClassName="p-4"
        />
      )}
    </SafeContainer>
  );
}

//#region Rendered Track
type RenderItemProps = DragListRenderItemInfo<TrackData> & {
  disableAfter: number;
  onRemove: (tKey: string) => void;
};

const RenderItem = memo(
  function RenderItem({
    item,
    index,
    disableAfter,
    onRemove,
  }: RenderItemProps) {
    const { t } = useTranslation();
    const { isActive, isDragging, onInitDrag } = useDragListState(index);
    return (
      <RemovableItem
        label={item.name}
        onRemove={() => onRemove(item.key)}
        disableRemove={item.active || isDragging}
        onPress={() =>
          item.active
            ? PlaybackControls.playToggle()
            : PlaybackControls.playAtIndex(index)
        }
        disabled={isDragging}
        className={cn("mb-2 rounded-xs active:bg-surfaceContainerLowest/50", {
          "bg-surfaceContainerLowest!": isActive,
          "opacity-25 active:opacity-100": index < disableAfter && !isActive,
        })}
      >
        <SearchResult
          type="track"
          title={item.name}
          description={getArtistsString(item.artists)}
          imageSource={item.artwork}
          LeftElement={item.active ? <PlayingIndicator /> : undefined}
          RightElement={
            <IconButton
              icon="drag-handle"
              accessibilityLabel={t("template.entryMove", { name: item.name })}
              onPressIn={onInitDrag}
              disabled={isDragging && !isActive}
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
      (["index", "disableAfter"] as const).every(
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
  const unorderedTracks = await getTracks([
    inArray(structuredTracksView.id, [...queueSet]),
  ]);

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
