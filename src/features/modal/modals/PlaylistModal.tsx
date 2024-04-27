import { BottomSheetView } from "@gorhom/bottom-sheet";
import { useSetAtom } from "jotai";
import { useMemo } from "react";
import { View } from "react-native";

import { usePlaylist } from "@/features/playlist/api/getPlaylist";
import { useToggleFavorite } from "@/features/playlist/api/toggleFavorite";
import { modalAtom } from "../store";

import { mutateGuard } from "@/lib/react-query";
import { TextLine } from "@/components/ui/Text";
import { ModalBase } from "../components/ModalBase";
import { ModalButton } from "../components/ModalButton";

/** @description Modal used for playlists. */
export function PlaylistModal({ playlistName }: { playlistName: string }) {
  const openModal = useSetAtom(modalAtom);
  const { isPending, error, data } = usePlaylist(playlistName);
  const toggleMutation = useToggleFavorite(playlistName);

  const snapPoints = useMemo(() => ["50%", "90%"], []);

  if (isPending || error) return null;

  // Add optimistic UI updates.
  const isToggled = toggleMutation.isPending
    ? !data.isFavorite
    : data.isFavorite;

  return (
    <ModalBase snapPoints={snapPoints}>
      <BottomSheetView className="px-4">
        <TextLine className="mx-2 mb-6 text-center font-ndot57 text-title text-foreground50">
          {data.name}
        </TextLine>
        <View className="mb-6">
          <ModalButton
            content={
              isToggled ? "Unfavorite this Playlist" : "Favorite this Playlist"
            }
            icon={{
              type: "ionicons",
              name: isToggled ? "heart" : "heart-outline",
            }}
            onPress={() => mutateGuard(toggleMutation, data.isFavorite)}
            dontCloseOnPress
          />

          <ModalButton
            content="Rename Playlist"
            icon={{ type: "ionicons", name: "text-outline" }}
            onPress={() =>
              openModal({
                type: "playlist-name",
                id: playlistName,
                origin: "update",
              })
            }
          />

          <ModalButton
            content="Delete Playlist"
            icon={{ type: "ionicons", name: "trash-outline" }}
            onPress={() =>
              openModal({ type: "playlist-delete", id: playlistName })
            }
          />
        </View>
      </BottomSheetView>
    </ModalBase>
  );
}
