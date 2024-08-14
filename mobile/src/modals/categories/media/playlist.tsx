import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useSetAtom } from "jotai";

import { useToggleFavorite } from "@/api/favorites/[id]";
import { usePlaylistForModal, useUpdatePlaylist } from "@/api/playlists/[id]";
import { mediaModalAtom } from "./store";

import { pickImage } from "@/lib/file-system";
import { mutateGuard } from "@/lib/react-query";
import { ScrollRow } from "@/components/ui/container";
import { Heading } from "@/components/ui/text";
import { ModalBase } from "../../components/base";
import { Button } from "../../components/button";

/** Modal used for playlists. */
export function PlaylistModal({ id }: { id: string }) {
  const openModal = useSetAtom(mediaModalAtom);
  const { isPending, error, data } = usePlaylistForModal(id);
  const toggleFavoriteFn = useToggleFavorite({ type: "playlist", id });
  const updatePlaylistFn = useUpdatePlaylist(id);

  if (isPending || error) return null;

  // Add optimistic UI updates.
  const isToggled = toggleFavoriteFn.isPending
    ? !data.isFavorite
    : data.isFavorite;

  return (
    <ModalBase detached>
      <BottomSheetScrollView>
        <Heading as="h3" asLine className="mb-6 px-4">
          {data.name}
        </Heading>

        <ScrollRow>
          <Button
            content={isToggled ? "Unfavorite" : "Favorite"}
            icon={isToggled ? "FavoriteFilled" : "FavoriteOutline"}
            onPress={() => mutateGuard(toggleFavoriteFn, undefined)}
            dontCloseOnPress
          />
          <Button
            content="Rename"
            icon="MatchCaseOutline"
            onPress={() =>
              openModal({ entity: "playlist", scope: "update", id })
            }
          />
          <Button
            content="Change Cover"
            icon="ImageOutline"
            onPress={async () => {
              try {
                mutateGuard(updatePlaylistFn, {
                  field: "artwork",
                  value: await pickImage(),
                });
              } catch {}
            }}
          />
          {typeof data.imageSource === "string" && (
            <Button
              content="Remove Cover"
              icon="HideImageOutline"
              onPress={() =>
                mutateGuard(updatePlaylistFn, { field: "artwork", value: null })
              }
            />
          )}
          <Button
            content="Delete"
            icon="DeleteOutline"
            onPress={() =>
              openModal({ entity: "playlist", scope: "delete", id })
            }
          />
        </ScrollRow>
      </BottomSheetScrollView>
    </ModalBase>
  );
}
