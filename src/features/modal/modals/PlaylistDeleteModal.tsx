import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Text, View } from "react-native";

import { useDeletePlaylist } from "@/api/playlists/[id]";

import { mutateGuard } from "@/lib/react-query";
import { Heading } from "@/components/ui/Text";
import { ModalBase } from "../components/ModalBase";
import { ModalFormButton } from "../components/ModalFormButton";

/** @description Modal used for deleting playlists. */
export function PlaylistDeleteModal({ id }: { id: string }) {
  const deletePlaylistFn = useDeletePlaylist(id);

  return (
    <ModalBase detached>
      <BottomSheetScrollView className="px-4">
        <Heading as="h1">Delete Playlist</Heading>
        <Heading as="h4" asLine className="mb-8 text-accent50">
          {id}
        </Heading>

        <Text className="mb-8 font-geistMonoLight text-sm text-foreground100">
          You understand that this action will{" "}
          <Text className="font-geistMono text-accent50">permanently</Text>{" "}
          delete this playlist.
        </Text>

        <View className="flex-row justify-end gap-2">
          <ModalFormButton variant="outline">CANCEL</ModalFormButton>
          <ModalFormButton
            theme="accent"
            onPress={() => mutateGuard(deletePlaylistFn, undefined)}
          >
            DELETE
          </ModalFormButton>
        </View>
      </BottomSheetScrollView>
    </ModalBase>
  );
}
