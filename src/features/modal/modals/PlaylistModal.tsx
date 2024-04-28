import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useSetAtom } from "jotai";
import { ScrollView } from "react-native-gesture-handler";

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

  if (isPending || error) return null;

  // Add optimistic UI updates.
  const isToggled = toggleMutation.isPending
    ? !data.isFavorite
    : data.isFavorite;

  return (
    <ModalBase detached>
      <BottomSheetScrollView>
        <TextLine className="mb-8 px-4 text-center font-ndot57 text-title text-foreground50">
          {data.name}
        </TextLine>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          overScrollMode="never"
          contentContainerClassName="grow gap-2 px-4"
        >
          <ModalButton
            content={isToggled ? "Unfavorite" : "Favorite"}
            icon={isToggled ? "FavoriteFilled" : "FavoriteOutline"}
            onPress={() => mutateGuard(toggleMutation, data.isFavorite)}
            dontCloseOnPress
          />
          <ModalButton
            content="Rename"
            icon="MatchCaseOutline"
            onPress={() =>
              openModal({
                type: "playlist-name",
                id: playlistName,
                origin: "update",
              })
            }
          />
          <ModalButton
            content="Delete"
            icon="DeleteOutline"
            onPress={() =>
              openModal({ type: "playlist-delete", id: playlistName })
            }
          />
        </ScrollView>
      </BottomSheetScrollView>
    </ModalBase>
  );
}
