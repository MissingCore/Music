import { useTranslation } from "react-i18next";
import type { SheetProps } from "react-native-actions-sheet";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";

import { getTrackCover } from "@/db/utils";

import { Remove } from "@/icons";
import { Queue, useMusicStore } from "@/modules/media/services/Music";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { IconButton } from "@/components/Form";
import { Sheet } from "@/components/Sheet";
import { Swipeable } from "@/components/Swipeable";
import { SearchResult } from "@/modules/search/components";

/**
 * Sheet allowing us to see the upcoming tracks and remove tracks from
 * the queue.
 */
export default function TrackUpcomingSheet(
  props: SheetProps<"track-upcoming-sheet">,
) {
  const { t } = useTranslation();
  const trackList = useMusicStore((state) => state.currentTrackList);
  const queueList = useMusicStore((state) => state.queuedTrackList);
  const listIndex = useMusicStore((state) => state.listIdx);
  const repeat = useMusicStore((state) => state.repeat);

  // Get the tracks that'll be rendered.
  const data = [
    ...queueList,
    ...trackList.slice(listIndex + 1),
    ...trackList.slice(0, listIndex + 1),
  ];
  // Index where the tracks won't be played.
  const disableIndex = repeat
    ? trackList.length + queueList.length
    : trackList.length - 1 - listIndex + queueList.length;

  return (
    <Sheet
      id={props.sheetId}
      title={t("title.upcoming")}
      snapTop
      contentContainerClassName="px-0"
    >
      <FlashList
        estimatedItemSize={52} // 48px Height + 4px Margin Top
        data={data}
        keyExtractor={({ name }, index) => `${name}_${index}`}
        renderItem={({ item, index }) => {
          const itemContent = {
            title: item.name,
            description: item.artistName ?? "—",
            imageSource: getTrackCover(item),
          };

          const wrapperStyle = cn("px-4", {
            "opacity-25": index >= disableIndex,
            "mt-1": index !== 0,
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
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
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
