import { SheetManager } from "react-native-actions-sheet";

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
import { SheetsFlashList } from "@/components/Defaults";
import { Checkbox } from "@/components/Form";
import { Sheet } from "@/components/Sheet";
import { StyledText } from "@/components/Typography";

/** Sheet allowing us to select which playlists the track belongs to. */
export default function TrackToPlaylistSheet(props: {
  payload: { id: string };
}) {
  const { canvasAlt, surface } = useTheme();
  const { data } = usePlaylists();
  const { data: inList } = useTrackPlaylists(props.payload.id);
  const addToPlaylist = useAddToPlaylist(props.payload.id);
  const removeFromPlaylist = useRemoveFromPlaylist(props.payload.id);

  return (
    <Sheet
      id="TrackToPlaylistSheet"
      titleKey="playlist.add"
      // Hide the Track sheet when we close this sheet since it's still open.
      onBeforeClose={() => SheetManager.hide("TrackSheet")}
      snapTop
    >
      <SheetsFlashList
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
              wrapperClassName={cn({ "mt-1": index > 0 })}
            >
              <Marquee color={selected ? surface : canvasAlt}>
                <StyledText>{item.name}</StyledText>
              </Marquee>
            </Checkbox>
          );
        }}
        contentContainerClassName="pb-4"
        emptyMsgKey="response.noPlaylists"
      />
    </Sheet>
  );
}
