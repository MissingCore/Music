// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { queries as q } from "~/data/keyStore";
import { usePlaylistsNames } from "~/data/playlist/queries";
import { toggleTrackInPlaylist } from "~/data/track/api";
import { useTrackPlaylists } from "~/data/track/queries";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { FlatList, getListItemLayout } from "~/components/Base/List";
import { CheckboxField } from "~/components/Form/Checkbox";
import { Marquee } from "~/components/Marquee";
import { DetachedSheet } from "~/components/Sheet";
import { useEnableSheetScroll } from "~/components/Sheet/useEnableSheetScroll";
import { StyledText } from "~/components/Typography/StyledText";

const GLOBAL_SHEET_KEY = "TrackToPlaylistsSheet";

export function TrackToPlaylistsSheet({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { data: playlistsNames } = usePlaylistsNames();
  const { data: inList } = useTrackPlaylists(id);
  const [inListSet, setInListSet] = useState(new Set<string>());
  const sheetListHandlers = useEnableSheetScroll();

  const toggleInPlaylist = useCallback(
    async (playlistName: string) => {
      await toggleTrackInPlaylist({ trackId: id, playlistName });
      setInListSet((prev) => {
        const updatedList = new Set(prev);
        const remove = updatedList.has(playlistName);
        updatedList[remove ? "delete" : "add"](playlistName);
        return updatedList;
      });
    },
    [id],
  );

  useEffect(() => {
    setInListSet(new Set(inList ?? []));
  }, [inList]);

  const handleSheetClose = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: q.tracks.detail(id).queryKey });
    queryClient.invalidateQueries({ queryKey: q.playlists._def });
    queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
  }, [queryClient, id]);

  return (
    <DetachedSheet
      globalKey={GLOBAL_SHEET_KEY}
      titleKey="feat.modalTrack.extra.addToPlaylist"
      onCleanup={handleSheetClose}
      snapTop
    >
      <FlatList
        data={playlistsNames}
        keyExtractor={(name) => name}
        extraData={inListSet}
        renderItem={({ item: name }) => (
          <CheckboxField
            checked={inListSet.has(name)}
            onCheck={() => toggleInPlaylist(name)}
            className="mb-2"
          >
            <Marquee color="surfaceBright">
              <StyledText>{name}</StyledText>
            </Marquee>
          </CheckboxField>
        )}
        getItemLayout={getListItemLayout}
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
