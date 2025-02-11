import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { getTrackCover } from "~/db/utils";

import { Remove } from "~/icons/Remove";
import { Queue, useMusicStore } from "~/modules/media/services/Music";
import { useUpcomingStore } from "./store";

import { Colors } from "~/constants/Styles";
import { cn } from "~/lib/style";
import { SheetsFlashList } from "~/components/Defaults";
import { IconButton } from "~/components/Form/Button";
import { Sheet } from "~/components/Sheet";
import { Swipeable } from "~/components/Swipeable";
import { SearchResult } from "~/modules/search/components/SearchResult";

/**
 * Sheet allowing us to see the upcoming tracks and remove tracks from
 * the queue.
 */
export default function TrackUpcomingSheet() {
  const { t } = useTranslation();
  const populateCurrentTrackList = useUpcomingStore(
    (state) => state.populateCurrentTrackList,
  );
  const trackList = useUpcomingStore((state) => state.currentTrackList);
  const queueList = useUpcomingStore((state) => state.queuedTrackList);
  const listIndex = useMusicStore((state) => state.listIdx);
  const repeat = useMusicStore((state) => state.repeat);

  // Get the tracks that'll be rendered.
  const data = [
    ...queueList,
    ...trackList.slice(listIndex + 1),
    ...trackList.slice(0, listIndex + 1),
  ];
  // Index where the tracks won't be played.
  const disableIndex =
    repeat !== "no-repeat"
      ? trackList.length + queueList.length
      : trackList.length - 1 - listIndex + queueList.length;

  useEffect(() => {
    populateCurrentTrackList();
  }, [populateCurrentTrackList]);

  return (
    <Sheet
      id="TrackUpcomingSheet"
      titleKey="title.upcoming"
      snapTop
      contentContainerClassName="px-0"
    >
      <SheetsFlashList
        estimatedItemSize={52} // 48px Height + 4px Margin Top
        data={data}
        keyExtractor={(item, index) => `${item?.name ?? ""}_${index}`}
        renderItem={({ item, index }) => {
          if (item === undefined) return null;

          const itemContent = {
            title: item.name,
            description: item.artistName ?? "—",
            imageSource: getTrackCover(item),
          };

          const wrapperStyle = cn("px-4", {
            "opacity-25": index >= disableIndex,
            "mt-1": index > 0,
          });

          if (index < queueList.length) {
            return (
              <Swipeable
                containerClassName={wrapperStyle}
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
                <TrackItem {...itemContent} inQueue />
              </Swipeable>
            );
          }

          return <TrackItem {...itemContent} className={wrapperStyle} />;
        }}
        contentContainerClassName="pb-4"
      />
    </Sheet>
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
      className={cn(props.className, "bg-canvas pr-2 dark:bg-neutral5", {
        "pr-6": !inQueue,
      })}
    />
  );
}
