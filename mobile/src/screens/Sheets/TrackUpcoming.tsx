import { useTranslation } from "react-i18next";
import { View } from "react-native";
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
import { StyledText } from "@/components/Typography";
import { MediaImage } from "@/modules/media/components";

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
            name: item.name,
            artistName: item.artistName ?? "—",
            artwork: getTrackCover(item),
          };

          const wrapperStyle = cn("px-4", {
            "opacity-25": index >= disableIndex,
            "mt-1": index !== 0,
            "mb-4": index === data!.length - 1,
          });

          if (index < queueList.length) {
            return (
              <Swipeable
                containerClassName={wrapperStyle}
                renderRightActions={() => (
                  <View className="pr-4">
                    <IconButton
                      accessibilityLabel={t("template.entryRemove", {
                        name: item.name,
                      })}
                      onPress={() => Queue.removeAtIndex(index)}
                      className="bg-red"
                    >
                      <Remove color={Colors.neutral100} />
                    </IconButton>
                  </View>
                )}
              >
                <TrackItem {...itemContent} inQueue />
              </Swipeable>
            );
          }

          return (
            <View className={wrapperStyle}>
              <TrackItem {...itemContent} />
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </Sheet>
  );
}

/**
 * Essentially `<Track />` without any playing functionality. Has special
 * behavior if the rendered track is part of the queue.
 */
function TrackItem(props: {
  name: string;
  artistName: string;
  artwork: string | null;
  inQueue?: boolean;
}) {
  return (
    <View className="min-h-12 flex-row items-center gap-2 bg-canvas dark:bg-neutral5">
      <MediaImage type="track" size={48} source={props.artwork} radius="sm" />
      <View className="shrink grow">
        <View className="shrink flex-row items-end gap-1">
          {props.inQueue && (
            <View
              aria-hidden
              className="mb-0.5 size-[14px] items-center justify-center rounded-sm bg-onSurface"
            >
              <StyledText style={{ fontSize: 8 }} className="leading-tight">
                Q
              </StyledText>
            </View>
          )}
          <StyledText numberOfLines={1} className="shrink grow text-sm">
            {props.name}
          </StyledText>
        </View>
        <StyledText preset="dimOnCanvas" numberOfLines={1}>
          {props.artistName}
        </StyledText>
      </View>
    </View>
  );
}
