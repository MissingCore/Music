import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useSetAtom } from "jotai";

import { usePlaylist } from "@/features/playlist/api/getPlaylist";
import { useToggleFavorite } from "@/features/playlist/api/toggleFavorite";
import { useDeletePlaylistCover } from "@/features/playlist/api/deletePlaylistCover";
import { useUpdatePlaylistCover } from "@/features/playlist/api/updatePlaylistCover";
import { modalAtom } from "../store";

import { mutateGuard } from "@/lib/react-query";
import { ModalBase } from "../components/ModalBase";
import { Button } from "../components/ModalInteractive";
import { ScrollRow, Title } from "../components/ModalUI";

/** @description Modal used for playlists. */
export function PlaylistModal({ playlistName }: { playlistName: string }) {
  const openModal = useSetAtom(modalAtom);
  const { isPending, error, data } = usePlaylist(playlistName);
  const toggleMutation = useToggleFavorite(playlistName);
  const updatePlaylistCover = useUpdatePlaylistCover(playlistName);
  const deletePlaylistCover = useDeletePlaylistCover(playlistName);

  if (isPending || error) return null;

  // Add optimistic UI updates.
  const isToggled = toggleMutation.isPending
    ? !data.isFavorite
    : data.isFavorite;

  return (
    <ModalBase detached>
      <BottomSheetScrollView>
        <Title asLine className="mb-8 px-4">
          {data.name}
        </Title>

        <ScrollRow>
          <Button
            content={isToggled ? "Unfavorite" : "Favorite"}
            icon={isToggled ? "FavoriteFilled" : "FavoriteOutline"}
            onPress={() => mutateGuard(toggleMutation, data.isFavorite)}
            dontCloseOnPress
          />
          <Button
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
          <Button
            content="Change Cover"
            icon="ImageOutline"
            onPress={() => mutateGuard(updatePlaylistCover, undefined)}
          />
          {typeof data.coverSrc === "string" && (
            <Button
              content="Remove Cover"
              icon="HideImageOutline"
              onPress={() => mutateGuard(deletePlaylistCover, undefined)}
            />
          )}
          <Button
            content="Delete"
            icon="DeleteOutline"
            onPress={() =>
              openModal({ type: "playlist-delete", id: playlistName })
            }
          />
        </ScrollRow>
      </BottomSheetScrollView>
    </ModalBase>
  );
}
