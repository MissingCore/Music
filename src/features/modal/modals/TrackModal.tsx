import { BottomSheetView } from "@gorhom/bottom-sheet";
import { useSetAtom } from "jotai";
import { View } from "react-native";

import { addTrackToQueueAtom } from "@/features/playback/api/playing";
import { useTrack } from "@/features/track/api/getTrack";
import { useToggleFavorite } from "@/features/track/api/toggleFavorite";
import { modalConfigAtom } from "../store";

import { mutateGuard } from "@/lib/react-query";
import { TextLine } from "@/components/ui/Text";
import type { MediaListType } from "@/components/media/types";
import { ModalBase } from "../components/ModalBase";
import { ModalButton } from "../components/ModalButton";
import { ModalLink } from "../components/ModalLink";

type Props = { trackId: string; origin?: MediaListType | "current-track" };

/** @description Modal used for tracks. */
export function TrackModal({ trackId, origin }: Props) {
  const setModalConfig = useSetAtom(modalConfigAtom);
  const addTrackToQueue = useSetAtom(addTrackToQueueAtom);
  const { isPending, error, data } = useTrack(trackId);
  const toggleMutation = useToggleFavorite(trackId);

  if (isPending || error) return null;

  // Add optimistic UI updates.
  const isToggled = toggleMutation.isPending
    ? !data.isFavorite
    : data.isFavorite;

  return (
    <ModalBase>
      <BottomSheetView className="px-4">
        <TextLine className="text-center font-ndot57 text-title text-foreground50">
          {data.name}
        </TextLine>
        <TextLine className="text-center font-ndot57 text-lg text-accent50">
          {origin === "artist" ? data.album?.name ?? "" : data.artistName}
        </TextLine>
      </BottomSheetView>
      <BottomSheetView className="p-4">
        <ModalButton
          content={isToggled ? "Unfavorite this Song" : "Favorite this Song"}
          icon={{
            type: "ionicons",
            name: isToggled ? "heart" : "heart-outline",
          }}
          onPress={() => mutateGuard(toggleMutation, data.isFavorite)}
          dontCloseOnPress
        />

        <ModalButton
          content="Add to Playlist"
          icon={{ type: "ionicons", name: "list-outline" }}
          onPress={() =>
            setModalConfig({ type: "track-to-playlist", ref: trackId })
          }
        />

        <ModalButton
          content="Add to Queue"
          icon={{ type: "ionicons", name: "git-branch-outline" }}
          onPress={() => addTrackToQueue(data.id)}
        />

        <View className="my-4 h-0.5 w-full rounded-full bg-surface500" />

        {!!data.album && origin !== "album" && (
          <ModalLink
            href={`/album/${data.album.id}`}
            content="View Album"
            icon={{ type: "feather", name: "disc" }}
          />
        )}

        {origin !== "artist" && (
          <ModalLink
            href={`/artist/${data.artistName}`}
            content="View Artist"
            icon={{ type: "ionicons", name: "person-outline" }}
          />
        )}

        {origin === "current-track" && (
          <ModalButton
            content="View Upcoming"
            icon={{ type: "ionicons", name: "albums-sharp" }}
            onPress={() => setModalConfig({ type: "upcoming-list" })}
          />
        )}
      </BottomSheetView>
    </ModalBase>
  );
}
