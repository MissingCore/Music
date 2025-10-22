// import type { ListRenderItemInfo } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { inArray } from "drizzle-orm";
// import { useState } from "react";
import { View } from "react-native";

import { tracks } from "~/db/schema";
import { getTrackCover } from "~/db/utils";

// import { Remove } from "~/resources/icons/Remove";
import { getTracks } from "~/api/track";
import { playbackStore, usePlaybackStore } from "~/stores/Playback/store";
// import { Queue } from "~/stores/Playback/actions";
// import type { UpcomingStore } from "../helpers/UpcomingStore";

// import { Colors } from "~/constants/Styles";
// import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { FlashList } from "~/components/Defaults";
// import { Button } from "~/components/Form/Button";
// import { Swipeable, useSwipeableRef } from "~/components/Swipeable";
import { SearchResult } from "~/modules/search/components/SearchResult";
import {
  ContentPlaceholder,
  PagePlaceholder,
} from "../../components/Placeholder";

export default function Upcoming() {
  const { isPending, error, data: trackList } = useQueueTracks();
  const listIndex = usePlaybackStore((s) => s.queuePosition);
  const repeat = usePlaybackStore((s) => s.repeat);

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;

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
    <View className="flex-1">
      <FlashList
        estimatedItemSize={52} // 48px Height + 4px Margin Top
        data={data}
        keyExtractor={(item, index) => `${item?.id}_${index}`}
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
        ListEmptyComponent={
          <ContentPlaceholder isPending={trackList.length === 0} />
        }
        ListHeaderComponentStyle={{ marginHorizontal: -16 }}
        nestedScrollEnabled
        contentContainerClassName="px-4 pb-4"
      />
    </View>
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

//#region Query
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

  return queue.map((tId) => trackMap[tId]);
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
