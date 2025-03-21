import { toast } from "@backpackapp-io/react-native-toast";
import { useTranslation } from "react-i18next";

import { useCreatePlaylist, usePlaylists } from "~/queries/playlist";
import { Router } from "~/services/NavigationStore";
import { ModifyPlaylist } from "~/screens/ModifyPlaylist";

import { mutateGuardAsync } from "~/lib/react-query";
import { ToastOptions } from "~/lib/toast";

/** Screen for creating a playlist. */
export default function CreatePlaylistScreen() {
  const { t } = useTranslation();
  const { data } = usePlaylists();
  const createPlaylist = useCreatePlaylist();

  return (
    <ModifyPlaylist
      usedNames={data?.map(({ name }) => name) ?? []}
      onSubmit={async (playlistName, tracks) => {
        await mutateGuardAsync(
          createPlaylist,
          { playlistName, tracks },
          {
            onSuccess: () => {
              Router.replace(`/playlist/${encodeURIComponent(playlistName)}`);
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
