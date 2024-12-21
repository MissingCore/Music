import { toast } from "@backpackapp-io/react-native-toast";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getTrackCover } from "@/db/utils";

import { usePlaylist } from "@/queries/playlist";
import { ModifyPlaylist } from "@/screens/ModifyPlaylist";

import { mutateGuardAsync } from "@/lib/react-query";
import { ToastOptions } from "@/lib/toast";

/** Screen for modifying a playlist. */
export default function ModifyPlaylistScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = usePlaylist(id);

  const tracks = useMemo(() => {
    if (!data?.tracks) return [];
    return data.tracks.map((t) => ({ ...t, artwork: getTrackCover(t) }));
  }, [data?.tracks]);

  return (
    <ModifyPlaylist
      mode="edit"
      initialName={id}
      initialTracks={tracks}
      onSubmit={async (playlistName, tracks) => {
        console.log("Editing:", playlistName);
        // await mutateGuardAsync(
        //   createPlaylist,
        //   { playlistName, tracks },
        //   {
        //     onSuccess: () => {
        //       router.replace(`/playlist/${encodeURIComponent(playlistName)}`);
        //     },
        //     onError: () => {
        //       toast.error(t("errorScreen.generic"), ToastOptions);
        //     },
        //   },
        // );
      }}
    />
  );
}
