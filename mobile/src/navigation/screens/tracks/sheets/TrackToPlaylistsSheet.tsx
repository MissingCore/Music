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
import { DetachedSheet } from "~/components/Sheet/Detached";
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
        getEstimatedItemSize={(index) => (index === 0 ? 54 : 62)}
        data={playlistsNames}
        keyExtractor={(name) => name}
        extraData={inList}
        renderItem={({ item: name, index }) => {
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
              className={index > 0 ? "mt-2" : undefined}
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
        contentContainerClassName="pb-4"
      />
    </DetachedSheet>
  );
}
