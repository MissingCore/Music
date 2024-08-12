import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Text, View } from "react-native";

import { useDeletePlaylist } from "@/api/playlists/[id]";

import { mutateGuard } from "@/lib/react-query";
import { Heading } from "@/components/ui/text";
import { ModalFormButton } from "../components/form-button";
import { ModalBase } from "../components/modal-base";

/** Modal used for deleting playlists. */
export function PlaylistDeleteModal({ id }: { id: string }) {
  const deletePlaylistFn = useDeletePlaylist(id);

  return (
    <ModalBase detached>
      <BottomSheetScrollView className="px-4">
        <Heading as="h3">Delete Playlist</Heading>
        <Heading as="h5" asLine className="mb-6 text-accent50">
          {id}
        </Heading>

        <Text className="mb-8 font-geistMonoLight text-xs text-foreground100">
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
