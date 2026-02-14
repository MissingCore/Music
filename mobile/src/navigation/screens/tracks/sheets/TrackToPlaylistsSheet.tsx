import { usePlaylistsNames } from "~/queries/playlist";
import {
  useAddToPlaylist,
  useRemoveFromPlaylist,
  useTrackPlaylists,
} from "~/queries/track";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { mutateGuard } from "~/lib/react-query";
import { LegendList } from "~/components/Defaults";
import { CheckboxField } from "~/components/Form/Checkbox";
import { Marquee } from "~/components/Marquee";
import { DetachedSheet } from "~/components/Sheet";
import { useEnableSheetScroll } from "~/components/Sheet/useEnableSheetScroll";
import { StyledText } from "~/components/Typography/StyledText";

const GLOBAL_SHEET_KEY = "TrackToPlaylistsSheet";

export function TrackToPlaylistsSheet({ id }: { id: string }) {
  const { data: playlistsNames } = usePlaylistsNames();
  const { data: inList } = useTrackPlaylists(id);
  const addToPlaylist = useAddToPlaylist(id);
  const removeFromPlaylist = useRemoveFromPlaylist(id);
  const sheetListHandlers = useEnableSheetScroll();

  return (
    <DetachedSheet
      globalKey={GLOBAL_SHEET_KEY}
      titleKey="feat.modalTrack.extra.addToPlaylist"
      snapTop
    >
      <LegendList
        estimatedItemSize={62} // 54px Height + 8px Margin Bottom
        data={playlistsNames}
        keyExtractor={(name) => name}
        extraData={inList}
        renderItem={({ item: name }) => {
          const selected = inList?.includes(name) ?? false;
          return (
            <CheckboxField
              checked={selected}
              onCheck={() =>
                mutateGuard(
                  // @ts-expect-error - We don't care about return type.
                  selected ? removeFromPlaylist : addToPlaylist,
                  name,
                )
              }
              className="mb-2"
            >
              <Marquee color="surfaceBright">
                <StyledText>{name}</StyledText>
              </Marquee>
            </CheckboxField>
          );
        }}
        ListEmptyComponent={
          <ContentPlaceholder errMsgKey="err.msg.noPlaylists" />
        }
        {...sheetListHandlers}
        className="-mb-2"
        contentContainerClassName="pb-4"
      />
    </DetachedSheet>
  );
}
