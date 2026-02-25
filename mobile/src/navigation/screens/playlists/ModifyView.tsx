import { toast } from "@backpackapp-io/react-native-toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { usePlaylist, usePlaylistsNames } from "~/data/playlist/queries";
import { useUpdatePlaylist } from "~/queries/playlist";

import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { ModifyPlaylistBase } from "./components/ModifyViewBase";

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
  const playlistNamesQuery = usePlaylistsNames();
  const playlistQuery = usePlaylist(id);
  const updatePlaylist = useUpdatePlaylist(id);

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
    tracks: playlistQuery.data.tracks.map((track) => ({
      id: track.id,
      name: track.name,
      artists: track.artists?.join(", ") ?? "—",
      artwork: track.artwork,
    })),
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
