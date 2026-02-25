import { toast } from "@backpackapp-io/react-native-toast";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { useCreatePlaylist, usePlaylistsNames } from "~/data/playlist/queries";

import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { ModifyPlaylistBase } from "./components/ModifyViewBase";

import { mutateGuardAsync } from "~/lib/react-query";
import { ToastOptions } from "~/lib/toast";

export default function CreatePlaylist() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { isPending, error, data: playlistsNames } = usePlaylistsNames();
  const createPlaylist = useCreatePlaylist();

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;
  return (
    <ModifyPlaylistBase
      usedNames={playlistsNames}
      onSubmit={async ({ name, tracks }) => {
        await mutateGuardAsync(
          createPlaylist,
          { name, tracks },
          {
            onSuccess: () => {
              navigation.replace("Playlist", { id: name });
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
