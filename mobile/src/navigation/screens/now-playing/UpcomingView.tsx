import type { ListRenderItemInfo } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { inArray } from "drizzle-orm";
import { useMemo } from "react";

import { tracks } from "~/db/schema";
import { getTrackCover } from "~/db/utils";

// import { Remove } from "~/resources/icons/Remove";
import { getTracks } from "~/api/track";
import { playbackStore, usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls } from "~/stores/Playback/actions";

// import { Colors } from "~/constants/Styles";
// import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { FlashList } from "~/components/Defaults";
// import { Button } from "~/components/Form/Button";
// import { Swipeable, useSwipeableRef } from "~/components/Swipeable";
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

  const modifiedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const activeTrack = data[listIndex];
    if (!activeTrack) return data;
    return data.toSpliced(listIndex, 1, { ...activeTrack, active: true });
  }, [data, listIndex]);

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;

  // Index where the tracks won't be played.
  const disableIndex = repeat === RepeatModes.NO_REPEAT ? listIndex : 0;

  return (
    <FlashList
      estimatedItemSize={56} // 48px Height + 8px Margin Top
      initialScrollIndex={listIndex}
      estimatedFirstItemOffset={8}
      data={modifiedData}
      keyExtractor={(item, index) => `${item?.id}_${index}`}
      renderItem={({ item, ...args }) =>
        item ? (
          <TrackItem item={item} disableAfter={disableIndex} {...args} />
        ) : null
      }
      ListEmptyComponent={<ContentPlaceholder isPending={data.length === 0} />}
      nestedScrollEnabled
      contentContainerClassName="p-4"
    />
  );
}

// function RenderQueueItem({ item, index }: ListRenderItemInfo<PartialTrack>) {
//   const { t } = useTranslation();
//   const swipeableRef = useSwipeableRef();
//   const [lastItemId, setLastItemId] = useState(item?.id);

//   if (item?.id !== lastItemId) {
//     setLastItemId(item?.id);
//     if (swipeableRef.current) swipeableRef.current.resetIfNeeded();
//   }

//   if (!item) return null;
//   return (
//     <Swipeable
//       // @ts-expect-error - Error assigning ref to class component.
//       ref={swipeableRef}
//       containerClassName="mb-1 px-4"
//       renderRightActions={() => (
//         <Button
//           accessibilityLabel={t("template.entryRemove", { name: item.name })}
//           onPress={() => Queue.removeAtIndex(index)}
//           className={cn("bg-red p-3", OnRTL.decide("ml-4", "mr-4"))}
//         >
//           <Remove color={Colors.neutral100} />
//         </Button>
//       )}
//     >
//       <TrackItem
//         title={item.name}
//         description={item.artistName ?? "—"}
//         imageSource={getTrackCover(item)}
//         inQueue
//       />
//     </Swipeable>
//   );
// }

function TrackItem({
  item: { active, ...item },
  index,
  disableAfter,
}: ListRenderItemInfo<TrackData> & { disableAfter: number }) {
  return (
    // @ts-expect-error - Valid conditional use of `onPress`.
    <SearchResult
      as={active ? "default" : "ripple"}
      type="track"
      onPress={!active ? () => PlaybackControls.playAtIndex(index) : undefined}
      title={item.name}
      description={item.artistName ?? "—"}
      imageSource={getTrackCover(item)}
      LeftElement={active ? <PlayingIndicator /> : undefined}
      poppyLabel={active}
      className={cn("bg-canvasAlt pr-6", {
        "opacity-25": index < disableAfter,
        "mt-2": index > 0,
      })}
    />
  );
}

//#region Data Query
type TrackData = NonNullable<
  Awaited<ReturnType<typeof getQueueTracks>>[number]
>;

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

  return queue.map((tId) => trackMap[tId]) as Array<
    (typeof unorderedTracks)[number] & { active?: boolean }
  >;
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
