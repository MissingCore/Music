import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Text, View } from "react-native";

import { useDeletePlaylist } from "@/api/playlists/[id]";

import { mutateGuard } from "@/lib/react-query";
import { ModalBase } from "../components/ModalBase";
import { ModalFormButton } from "../components/ModalFormButton";
import { Subtitle, Title } from "../components/ModalUI";

/** @description Modal used for deleting playlists. */
export function PlaylistDeleteModal({
  playlistName,
}: {
  playlistName: string;
}) {
  const deletePlaylistFn = useDeletePlaylist(playlistName);

  return (
    <ModalBase detached>
      <BottomSheetScrollView className="px-4">
        <Title>Delete Playlist</Title>
        <Subtitle asLine className="mb-8">
          {playlistName}
        </Subtitle>

        <Text className="mb-8 font-geistMonoLight text-sm text-foreground100">
          You understand that this action will{" "}
          <Text className="font-geistMonoMedium text-accent50">
            permanently
          </Text>{" "}
          delete this playlist.
        </Text>

        <View className="flex-row justify-end gap-2">
          <ModalFormButton content="CANCEL" />
          <ModalFormButton
            theme="accent"
            onPress={() => mutateGuard(deletePlaylistFn, undefined)}
            content="DELETE"
          />
        </View>
      </BottomSheetScrollView>
    </ModalBase>
  );
}
