import { useTranslation } from "react-i18next";
import type { SheetProps } from "react-native-actions-sheet";
import { SheetManager } from "react-native-actions-sheet";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";

import { usePlaylists } from "@/queries/playlist";
import {
  useAddToPlaylist,
  useRemoveFromPlaylist,
  useTrackPlaylists,
} from "@/queries/track";
import { useTheme } from "@/hooks/useTheme";

import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import { Marquee } from "@/components/Containment";
import { Checkbox } from "@/components/Form";
import { Loading } from "@/components/Loading";
import { Sheet } from "@/components/Sheet";
import { StyledText } from "@/components/Typography";

/** Sheet allowing us to select which playlists the track belongs to. */
export default function TrackToPlaylistSheet(
  props: SheetProps<"track-to-playlist-sheet">,
) {
  const { t } = useTranslation();
  const { canvasAlt, surface } = useTheme();
  const { isPending, data } = usePlaylists();
  const { data: inList } = useTrackPlaylists(props.payload!.id);
  const addToPlaylist = useAddToPlaylist(props.payload!.id);
  const removeFromPlaylist = useRemoveFromPlaylist(props.payload!.id);

  return (
    <Sheet
      id={props.sheetId}
      title={t("playlist.add")}
      // Hide the Track sheet when we close this sheet since it's still open.
      onBeforeClose={() => SheetManager.hide("track-sheet")}
      snapTop
    >
      <FlashList
        estimatedItemSize={58} // 54px Height + 4px Margin Top
        data={data}
        keyExtractor={({ name }) => name}
        renderItem={({ item, index }) => {
          const selected = inList?.includes(item.name) ?? false;
          return (
            <Checkbox
              selected={selected}
              onSelect={() =>
                mutateGuard(
                  selected ? removeFromPlaylist : addToPlaylist,
                  item.name,
                )
              }
              wrapperClassName={cn({ "mt-1": index !== 0 })}
            >
              <Marquee color={selected ? surface : canvasAlt}>
                <StyledText>{item.name}</StyledText>
              </Marquee>
            </Checkbox>
          );
        }}
        ListEmptyComponent={
          isPending ? (
            <Loading />
          ) : (
            <StyledText center>{t("response.noPlaylists")}</StyledText>
          )
        }
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-4"
      />
    </Sheet>
  );
}
