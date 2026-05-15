import { useMemo } from "react";

import { usePlaylistsNames } from "~/data/playlist/queries";
import {
  useToggleTrackInPlaylist,
  useTrackPlaylists,
} from "~/data/track/queries";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { mutateGuard } from "~/lib/react-query";
import { FlatList } from "~/components/Base/List";
import { CheckboxField } from "~/components/Form/Checkbox";
import { Marquee } from "~/components/Marquee";
import { DetachedSheet } from "~/components/Sheet";
import { useEnableSheetScroll } from "~/components/Sheet/useEnableSheetScroll";
import { StyledText } from "~/components/Typography/StyledText";

const GLOBAL_SHEET_KEY = "TrackToPlaylistsSheet";

export function TrackToPlaylistsSheet({ id }: { id: string }) {
  const { data: playlistsNames } = usePlaylistsNames();
  const { data: inList } = useTrackPlaylists(id);
  const toggleInPlaylist = useToggleTrackInPlaylist(id);
  const sheetListHandlers = useEnableSheetScroll();

  const inListSet = useMemo(() => new Set(inList ?? []), [inList]);

  return (
    <DetachedSheet
      globalKey={GLOBAL_SHEET_KEY}
      titleKey="feat.modalTrack.extra.addToPlaylist"
      snapTop
    >
      <FlatList
        data={playlistsNames}
        keyExtractor={(name) => name}
        extraData={inListSet}
        renderItem={({ item: name }) => (
          <CheckboxField
            checked={inListSet.has(name)}
            onCheck={() => mutateGuard(toggleInPlaylist, name)}
            className="mb-2"
          >
            <Marquee color="surfaceBright">
              <StyledText>{name}</StyledText>
            </Marquee>
          </CheckboxField>
        )}
        getItemLayout={getItemLayout}
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

function getItemLayout(_: unknown, index: number) {
  // 54px Height + 8px Margin Bottom
  return { length: 62, offset: 62 * index, index };
}
