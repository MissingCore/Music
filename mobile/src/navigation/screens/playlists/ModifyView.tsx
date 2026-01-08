import { toast } from "@backpackapp-io/react-native-toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getTrackArtwork } from "~/api/track.utils";
import {
  usePlaylist,
  usePlaylists,
  useUpdatePlaylist,
} from "~/queries/playlist";
import { ModifyPlaylistBase } from "./ModifyViewBase";

import { mutateGuardAsync } from "~/lib/react-query";
import { ToastOptions } from "~/lib/toast";

type Props = StaticScreenProps<{ id: string }>;

export default function ModifyPlaylist({
  route: {
    params: { id },
  },
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { data: allPlaylists } = usePlaylists();
  const { data } = usePlaylist(id);
  const updatePlaylist = useUpdatePlaylist(id);

  const initialTracks = useMemo(() => {
    if (!data?.tracks) return [];
    return data.tracks.map((t) => {
      t.artwork = getTrackArtwork(t);
      return t;
    });
  }, [data?.tracks]);

  return (
    <ModifyPlaylistBase
      mode="edit"
      usedNames={allPlaylists?.map(({ name }) => name) ?? []}
      initialName={id}
      initialTracks={initialTracks}
      onSubmit={async (playlistName, tracks) => {
        // Don't update playlist name if it hasn't changed.
        const newName = id === playlistName ? undefined : playlistName;
        // Don't update tracks if they didn't change.
        const tracksUnchanged =
          initialTracks.length === tracks.length &&
          initialTracks.every((t, index) => t.id === tracks[index]?.id);

        await mutateGuardAsync(
          updatePlaylist,
          { name: newName, tracks: tracksUnchanged ? undefined : tracks },
          {
            onSuccess: () => {
              navigation.goBack();
              // If playlist name changed, see the new playlist page.
              if (newName !== undefined) {
                navigation.replace("Playlist", { id: newName });
              }
            },
            onError: () => {
              toast.error(t("err.flow.generic.title"), ToastOptions);
            },
          },
        );
      }}
    />
  );
}
