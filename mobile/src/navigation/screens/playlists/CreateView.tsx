import { toast } from "@backpackapp-io/react-native-toast";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { useCreatePlaylist, usePlaylistsNames } from "~/queries/playlist";
import { ModifyPlaylistBase } from "./ModifyViewBase";

import { mutateGuardAsync } from "~/lib/react-query";
import { ToastOptions } from "~/lib/toast";

export default function CreatePlaylist() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { data: playlistsNames } = usePlaylistsNames();
  const createPlaylist = useCreatePlaylist();

  return (
    <ModifyPlaylistBase
      usedNames={playlistsNames ?? []}
      onSubmit={async (playlistName, tracks) => {
        await mutateGuardAsync(
          createPlaylist,
          { playlistName, tracks },
          {
            onSuccess: () => {
              navigation.replace("Playlist", { id: playlistName });
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
