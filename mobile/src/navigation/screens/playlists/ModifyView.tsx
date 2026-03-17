import { toast } from "@backpackapp-io/react-native-toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { queries as q } from "~/data/keyStore";
import { updatePlaylist } from "~/data/playlist/api";
import { usePlaylist, usePlaylistsNames } from "~/data/playlist/queries";
import { Resynchronize } from "~/stores/Playback/actions";

import { PagePlaceholder } from "~/navigation/components/Placeholder";
import {
  ModifyPlaylistBase,
  formatTrackForForm,
} from "./components/ModifyViewBase";

import { ToastOptions } from "~/lib/toast";

type Props = StaticScreenProps<{ id: string }>;

export default function ModifyPlaylist({
  route: {
    params: { id },
  },
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();
  const playlistNamesQuery = usePlaylistsNames();
  const playlistQuery = usePlaylist(id);

  if (
    playlistNamesQuery.isPending ||
    playlistNamesQuery.error ||
    playlistQuery.isPending ||
    playlistQuery.error ||
    !playlistQuery.data
  ) {
    return (
      <PagePlaceholder
        isPending={playlistNamesQuery.isPending || playlistQuery.isPending}
      />
    );
  }

  const initData = {
    name: id,
    tracks: playlistQuery.data.tracks.map(formatTrackForForm),
  };

  return (
    <ModifyPlaylistBase
      mode="edit"
      usedNames={playlistNamesQuery.data}
      initialData={initData}
      onSubmit={async ({ name: playlistName, tracks }) => {
        // Don't update playlist name if it hasn't changed.
        const newName = id === playlistName ? undefined : playlistName;
        // Don't update tracks if they didn't change.
        const tracksUnchanged =
          initData.tracks.length === tracks.length &&
          initData.tracks.every((t, index) => t.id === tracks[index]?.id);

        try {
          await updatePlaylist(id, {
            name: newName, //? Should be sanitized by Zod schema.
            tracks: tracksUnchanged ? undefined : tracks,
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
          toast.error(t("err.flow.generic.title"), ToastOptions);
        }
      }}
    />
  );
}
