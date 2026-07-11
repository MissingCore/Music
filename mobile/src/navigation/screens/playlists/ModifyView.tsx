// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";

import { queries as q } from "~/data/keyStore";
import { deletePlaylist, updatePlaylist } from "~/data/playlist/api";
import { usePlaylist } from "~/data/playlist/queries";
import { Resynchronize } from "~/stores/Playback/actions";

import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { wait } from "~/utils/promise";
import { FavoritesPlaylistKey } from "~/modules/media/constants";
import {
  ModifyPlaylistBase,
  usePreloadReferenceData,
} from "./components/ModifyViewBase";

type Props = StaticScreenProps<{ id: string }>;

export default function ModifyPlaylist({
  route: {
    params: { id },
  },
}: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();
  const playlistQuery = usePlaylist(id);
  const preloadFormDataQuery = usePreloadReferenceData();

  if (
    preloadFormDataQuery.isPending ||
    preloadFormDataQuery.isRefetching ||
    preloadFormDataQuery.error ||
    playlistQuery.isPending ||
    playlistQuery.isRefetching ||
    playlistQuery.error ||
    !playlistQuery.data
  ) {
    return (
      <PagePlaceholder
        isPending={
          preloadFormDataQuery.isPending ||
          preloadFormDataQuery.isRefetching ||
          playlistQuery.isPending ||
          playlistQuery.isRefetching
        }
      />
    );
  }

  const isFavoritesList = id === FavoritesPlaylistKey;
  const initData = {
    name: id,
    trackIds: playlistQuery.data.tracks.map((t) => t.id),
  };

  return (
    <ModifyPlaylistBase
      referenceData={preloadFormDataQuery.data}
      initialData={initData}
      actionConfig={
        isFavoritesList
          ? undefined
          : {
              label: "form.delete",
              action: async () => {
                await wait(1);
                try {
                  await deletePlaylist(id);

                  queryClient.invalidateQueries({ queryKey: q.playlists._def });
                  queryClient.invalidateQueries({ queryKey: q.tracks._def });
                  queryClient.invalidateQueries({
                    queryKey: q.favorites.lists.queryKey,
                  });
                  queryClient.invalidateQueries({ queryKey: ["search"] });

                  navigation.goBack();
                  navigation.goBack();
                } catch {
                  toast.tError("err.flow.generic.title");
                }
              },
              danger: true,
            }
      }
      onSubmit={async ({ name: playlistName, trackIds }) => {
        // Don't update playlist name if it hasn't changed.
        const newName = id === playlistName ? undefined : playlistName;
        // Don't update tracks if they didn't change.
        const tracksUnchanged =
          initData.trackIds.length === trackIds.length &&
          initData.trackIds.every((tId, index) => tId === trackIds[index]);

        try {
          await updatePlaylist(id, {
            name: newName, //? Should be sanitized by Zod schema.
            tracks: tracksUnchanged
              ? undefined
              : trackIds.map((id) => ({ id })),
          });

          if (newName) {
            await Resynchronize.onRename({
              oldSource: { type: "playlist", id: playlistName },
              newSource: { type: "playlist", id: newName },
            });
          }

          queryClient.invalidateQueries({ queryKey: q.playlists._def });
          queryClient.invalidateQueries({ queryKey: q.tracks._def });
          queryClient.invalidateQueries({
            queryKey: q.favorites.lists.queryKey,
          });
          queryClient.invalidateQueries({ queryKey: ["search"] });

          navigation.goBack();
          // If playlist name changed, see the new playlist page.
          if (newName !== undefined) {
            navigation.replace("Playlist", { id: newName });
          }
        } catch {
          toast.tError("err.flow.generic.title");
        }
      }}
    />
  );
}
