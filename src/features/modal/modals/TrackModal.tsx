import UnwrappedBottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useSetAtom } from "jotai";
import { cssInterop } from "nativewind";
import { useCallback, useMemo, useRef } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTrack } from "@/features/track/api/getTrack";
import type { ModalConfig } from "../store";
import { modalConfigAtom } from "../store";

import { TextLine } from "@/components/ui/Text";
import { Backdrop } from "../components/Backdrop";
import { ModalButton } from "../components/ModalButton";
import { ModalLink } from "../components/ModalLink";

const BottomSheet = cssInterop(UnwrappedBottomSheet, {
  className: "style",
  backgroundClassName: "backgroundStyle",
  handleClassName: "handleStyle",
  handleIndicatorClassName: "handleIndicatorStyle",
});

type Props = { trackId: string } & Pick<ModalConfig, "origin">;

/** @description Modal used for tracks. */
export function TrackModal({ trackId, origin }: Props) {
  const insets = useSafeAreaInsets();
  const setModalConfig = useSetAtom(modalConfigAtom);
  const { isPending, error, data } = useTrack(trackId);

  const bottomSheetRef = useRef<UnwrappedBottomSheet>(null);
  const snapPoints = useMemo(() => ["50%", "100%"], []);

  const closeModal = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) setModalConfig(null);
    },
    [setModalConfig],
  );

  if (isPending || error) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      topInset={insets.top}
      backdropComponent={Backdrop}
      backgroundClassName="bg-surface800"
      handleIndicatorClassName="bg-surface500"
    >
      <BottomSheetView className="px-4">
        <TextLine className="text-center font-ndot57 text-title text-foreground50">
          {data.name}
        </TextLine>
        <TextLine className="text-center font-ndot57 text-lg text-accent50">
          {data.artistName}
        </TextLine>
      </BottomSheetView>
      <BottomSheetView className="p-4">
        <ModalButton
          content="Favorite this Song"
          icon={{ type: "ionicons", name: "heart-outline" }}
          onClose={closeModal}
          onPress={() => console.log("Favoriting song...")}
        />

        <ModalButton
          content="Add to Playlist"
          icon={{ type: "ionicons", name: "list-outline" }}
          onClose={closeModal}
          onPress={() => console.log("Opening up adding to playlist modal...")}
        />

        <ModalButton
          content="Add to Queue"
          icon={{ type: "ionicons", name: "git-branch-outline" }}
          onClose={closeModal}
          onPress={() => console.log("Adding song to queue...")}
        />

        <View className="my-4 h-0.5 w-full rounded-full bg-surface500" />

        {!!data.album && origin !== "album" && (
          <ModalLink
            href={`/album/${data.album.id}`}
            content="View Album"
            icon={{ type: "feather", name: "disc" }}
            onClose={closeModal}
          />
        )}

        {origin !== "artist" && (
          <ModalLink
            href={`/artist/${encodeURIComponent(data.artistName)}`}
            content="View Artist"
            icon={{ type: "ionicons", name: "person-outline" }}
            onClose={closeModal}
          />
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}
