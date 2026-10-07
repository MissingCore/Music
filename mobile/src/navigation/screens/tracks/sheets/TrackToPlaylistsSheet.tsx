// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { queries as q } from "~/data/keyStore";
import { usePlaylistsNames } from "~/data/playlist/queries";
import { toggleTrackInPlaylist } from "~/data/track/api";
import { useTrackPlaylists } from "~/data/track/queries";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { CheckboxField } from "~/components/Form/Checkbox";
import { Sheet } from "~/components/next/base/sheet";
import { Text } from "~/components/next/base/typography";
import { Marquee } from "~/components/next/blocks/marquee";

const GLOBAL_SHEET_KEY = "TrackToPlaylistsSheet";

export function TrackToPlaylistsSheet({ id }: { id: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: playlistsNames } = usePlaylistsNames();
  const { data: inList } = useTrackPlaylists(id);
  const [inListSet, setInListSet] = useState(new Set<string>());

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
  }, [queryClient, id]);

  return (
    <Sheet name={GLOBAL_SHEET_KEY} onCleanup={handleSheetClose} snapTop>
      <Sheet.Header label={t("feat.modalTrack.extra.addToPlaylist")} />
      <Sheet.List
        estimatedItemSize={52} // 48px Height + 6px Gap
        data={playlistsNames}
        keyExtractor={(name) => name}
        extraData={inListSet}
        renderItem={({ item: name }) => (
          <CheckboxField
            checked={inListSet.has(name)}
            onCheck={() => toggleInPlaylist(name)}
          >
            <Marquee>
              <Text>{name}</Text>
            </Marquee>
          </CheckboxField>
        )}
        ListEmptyComponent={
          <ContentPlaceholder errMsgKey="err.msg.noPlaylists" />
        }
        contentContainerClassName="gap-1.5"
      />
    </Sheet>
  );
}
