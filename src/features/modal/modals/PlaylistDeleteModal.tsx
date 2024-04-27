import { BottomSheetView } from "@gorhom/bottom-sheet";
import { useMemo } from "react";
import { Text, View } from "react-native";

import { usePlaylist } from "@/features/playlist/api/getPlaylist";
import { useDeletePlaylist } from "@/features/playlist/api/deletePlaylist";

import { mutateGuard } from "@/lib/react-query";
import { TextLine } from "@/components/ui/Text";
import { ModalBase } from "../components/ModalBase";
import { ModalFormButton } from "../components/ModalFormButton";

/** @description Modal used for deleting playlists. */
export function PlaylistDeleteModal({
  playlistName,
}: {
  playlistName: string;
}) {
  const { isPending, error, data } = usePlaylist(playlistName);
  const deletePlaylistFn = useDeletePlaylist(playlistName);

  const snapPoints = useMemo(() => ["50%", "90%"], []);

  if (isPending || error) return null;

  return (
    <ModalBase snapPoints={snapPoints}>
      <BottomSheetView className="px-6">
        <TextLine className="text-center font-ndot57 text-title text-foreground50">
          Delete Playlist
        </TextLine>
        <TextLine className="mb-6 text-center font-ndot57 text-lg text-accent50">
          {data.name}
        </TextLine>

        <Text className="mb-6 font-geistMonoLight text-sm text-foreground100">
          You understand that this action will{" "}
          <Text className="font-geistMonoMedium text-sm text-accent50">
            permanently
          </Text>{" "}
          delete this playlist.
        </Text>

        <View className="my-6 flex-row justify-end gap-2">
          <ModalFormButton content="CANCEL" />
          <ModalFormButton
            theme="pop"
            onPress={() => mutateGuard(deletePlaylistFn, undefined)}
            content="DELETE"
          />
        </View>
      </BottomSheetView>
    </ModalBase>
  );
}