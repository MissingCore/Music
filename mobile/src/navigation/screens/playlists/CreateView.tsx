import { toast } from "@backpackapp-io/react-native-toast";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { useCreatePlaylist, usePlaylists } from "~/queries/playlist";
import { ModifyPlaylist } from "~/screens/ModifyPlaylist";

import { mutateGuardAsync } from "~/lib/react-query";
import { ToastOptions } from "~/lib/toast";

export default function CreatePlaylist() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
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
