import type { UseMutationResult } from "@tanstack/react-query";
import { useState } from "react";
import { useWindowDimensions } from "react-native";

import { useAlbum, useUpdateAlbumArtwork } from "~/queries/album";
import { useArtist, useUpdateArtist } from "~/queries/artist";
import { usePlaylist, useUpdatePlaylist } from "~/queries/playlist";
import { useTrack, useUpdateTrackArtwork } from "~/queries/track";

import { pickImage } from "~/lib/file-system";
import { mutateGuard } from "~/lib/react-query";
import { wait } from "~/utils/promise";
import type { TrueSheetRef } from "~/components/Sheet";
import { Sheet, SheetButtonGroup } from "~/components/Sheet";
import { MediaImage } from "~/modules/media/components/MediaImage";
import type { MediaType } from "~/modules/media/types";

type ArtworkSheetProps = { id: string; sheetRef: TrueSheetRef };

/** Sheet allowing us to change the artwork of an album. */
export function AlbumArtworkSheet(props: ArtworkSheetProps) {
  const { data } = useAlbum(props.id);
  const updateAlbumArtwork = useUpdateAlbumArtwork(props.id);

  return (
    <Sheet ref={props.sheetRef} contentContainerClassName="items-center gap-6">
      <BaseArtworkSheetContent
        type="album"
        imageSource={data?.artwork ?? null}
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

/** Sheet allowing us to change the artwork of a track. */
export function TrackArtworkSheet(props: ArtworkSheetProps) {
  const { data } = useTrack(props.id);
  const updateTrackArtwork = useUpdateTrackArtwork(props.id);

  return (
    <Sheet ref={props.sheetRef} contentContainerClassName="items-center gap-6">
      <BaseArtworkSheetContent
        type="track"
        imageSource={data?.artwork ?? null}
        mutationResult={updateTrackArtwork}
        disabled={data?.altArtwork === null}
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
      <SheetButtonGroup
        leftButton={{
          textKey: "feat.artwork.extra.remove",
          onPress: async () => {
            setDisabled(true);
            await wait(1);
            mutateGuard(props.mutationResult, { artwork: null });
            setDisabled(false);
          },
          disabled:
            props.disabled ||
            disabled ||
            props.imageSource === null ||
            Array.isArray(props.imageSource),
        }}
        rightButton={{
          textKey: "feat.artwork.extra.change",
          onPress: async () => {
            setDisabled(true);
            try {
              mutateGuard(props.mutationResult, { artwork: await pickImage() });
            } catch {}
            setDisabled(false);
          },
          disabled,
        }}
      />
    </>
  );
}
