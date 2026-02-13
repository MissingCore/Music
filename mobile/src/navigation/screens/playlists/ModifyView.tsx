import { toast } from "@backpackapp-io/react-native-toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { getArtistsString } from "~/api/artist.utils";
import { getTrackArtwork } from "~/api/track.utils";
import {
  usePlaylist,
  usePlaylistsNames,
  useUpdatePlaylist,
} from "~/queries/playlist";

import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { ModifyPlaylistBase } from "./components/ModifyViewBase";

import { mutateGuardAsync } from "~/lib/react-query";
import { ToastOptions } from "~/lib/toast";
import { FavoritesPlaylistKey } from "~/modules/media/constants";

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
    isFavoritesList: id === FavoritesPlaylistKey,
    name: id,
    tracks: playlistQuery.data.tracks.map((t) => ({
      id: t.id,
      name: t.name,
      artists: getArtistsString(t.tracksToArtists),
      artwork: getTrackArtwork(t),
    })),
  };

  return (
    <ModifyPlaylistBase
      mode="edit"
      invalidNames={playlistNamesQuery.data}
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
