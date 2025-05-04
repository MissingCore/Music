import type { UseMutationResult } from "@tanstack/react-query";
import { useState } from "react";
import { View, useWindowDimensions } from "react-native";
import type { ActionSheetRef } from "react-native-actions-sheet";

import { useAlbum, useUpdateAlbumArtwork } from "~/queries/album";
import { useArtist, useUpdateArtist } from "~/queries/artist";
import { usePlaylist, useUpdatePlaylist } from "~/queries/playlist";

import { pickImage } from "~/lib/file-system";
import { mutateGuard } from "~/lib/react-query";
import { Button } from "~/components/Form/Button";
import { Sheet } from "~/components/Sheet";
import { TStyledText } from "~/components/Typography/StyledText";
import { MediaImage } from "~/modules/media/components/MediaImage";
import type { MediaType } from "~/modules/media/types";

type ArtworkSheetProps = {
  id: string;
  sheetRef: React.RefObject<ActionSheetRef>;
};

/** Sheet allowing us to change the artwork of an album. */
export function AlbumArtworkSheet(props: ArtworkSheetProps) {
  const { data } = useAlbum(props.id);
  const updateAlbumArtwork = useUpdateAlbumArtwork(props.id);

  return (
    <Sheet ref={props.sheetRef} contentContainerClassName="items-center gap-6">
      <BaseArtworkSheetContent
        type="album"
        imageSource={data?.altArtwork ?? data?.artwork ?? null}
        mutationResult={updateAlbumArtwork}
        disabled={data?.altArtwork === null}
      />
    </Sheet>
  );
}

/** Sheet allowing us to change the artwork of an artist. */
export function ArtistArtworkSheet(props: ArtworkSheetProps) {
  const { data } = useArtist(props.id);
  const updateArtist = useUpdateArtist(props.id);

  return (
    <Sheet ref={props.sheetRef} contentContainerClassName="items-center gap-6">
      <BaseArtworkSheetContent
        type="artist"
        imageSource={data?.artwork ?? null}
        mutationResult={updateArtist}
      />
    </Sheet>
  );
}

/** Sheet allowing us to change the artwork of a playlist. */
export function PlaylistArtworkSheet(props: ArtworkSheetProps) {
  const { data } = usePlaylist(props.id);
  const updatePlaylist = useUpdatePlaylist(props.id);

  return (
    <Sheet ref={props.sheetRef} contentContainerClassName="items-center gap-6">
      <BaseArtworkSheetContent
        type="playlist"
        imageSource={data?.imageSource ?? null}
        mutationResult={updatePlaylist}
      />
    </Sheet>
  );
}

/** Reusable sheet for changing the artwork of some media. */
function BaseArtworkSheetContent(props: {
  type: MediaType;
  imageSource: MediaImage.ImageSource | MediaImage.ImageSource[];
  mutationResult: UseMutationResult<any, Error, { artwork?: string | null }>;
  disabled?: boolean;
}) {
  const { height, width } = useWindowDimensions();
  const [disabled, setDisabled] = useState(false);

  return (
    <>
      {/* @ts-expect-error Things should be fine with proper usage. */}
      <MediaImage
        type={props.type}
        source={props.imageSource ?? null}
        size={width - 96 > height - 256 ? height - 256 : width - 96}
        className="mx-4"
      />
      <View className="flex-row gap-2">
        <Button
          onPress={() => {
            setDisabled(true);
            mutateGuard(props.mutationResult, { artwork: null });
            setDisabled(false);
          }}
          disabled={
            props.disabled ||
            disabled ||
            props.imageSource === null ||
            Array.isArray(props.imageSource)
          }
          className="flex-1"
        >
          <TStyledText
            textKey="feat.artwork.extra.remove"
            bold
            className="text-center text-sm"
          />
        </Button>
        <Button
          onPress={async () => {
            setDisabled(true);
            try {
              mutateGuard(props.mutationResult, { artwork: await pickImage() });
            } catch {}
            setDisabled(false);
          }}
          disabled={disabled}
          className="flex-1"
        >
          <TStyledText
            textKey="feat.artwork.extra.change"
            bold
            className="text-center text-sm"
          />
        </Button>
      </View>
    </>
  );
}
