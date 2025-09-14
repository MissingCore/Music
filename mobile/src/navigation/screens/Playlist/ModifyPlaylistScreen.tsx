import { toast } from "@backpackapp-io/react-native-toast";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getTrackCover } from "~/db/utils";

import {
  usePlaylist,
  usePlaylists,
  useUpdatePlaylist,
} from "~/queries/playlist";
import { ModifyPlaylist } from "~/screens/ModifyPlaylist";

import { mutateGuardAsync } from "~/lib/react-query";
import { ToastOptions } from "~/lib/toast";

export default function ModifyPlaylistScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: allPlaylists } = usePlaylists();
  const { data } = usePlaylist(id);
  const updatePlaylist = useUpdatePlaylist(id);

  const initialTracks = useMemo(() => {
    if (!data?.tracks) return [];
    return data.tracks.map((t) => {
      t.artwork = getTrackCover(t);
      return t;
    });
  }, [data?.tracks]);

  return (
    <ModifyPlaylist
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
              router.back();
              // If playlist name changed, see the new playlist page.
              if (newName !== undefined) {
                router.replace(`/playlist/${encodeURIComponent(newName)}`);
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
