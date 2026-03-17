import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useWindowDimensions } from "react-native";

import { queries as q } from "~/data/keyStore";
import { updateAlbum } from "~/data/album/api";
import { useAlbum } from "~/data/album/queries";
import { updateArtist } from "~/data/artist/api";
import { useArtist } from "~/data/artist/queries";
import { updateGenre } from "~/data/genre/api";
import { useGenre } from "~/data/genre/queries";
import { updatePlaylist } from "~/data/playlist/api";
import { usePlaylist } from "~/data/playlist/queries";
import { updateTrack } from "~/data/track/api";
import { useTrack } from "~/data/track/queries";
import { Resynchronize } from "~/stores/Playback/actions";

import { pickImage } from "~/lib/file-system";
import { clearAllQueries } from "~/lib/react-query";
import { wait } from "~/utils/promise";
import { DetachedSheet } from "~/components/Sheet";
import { SheetButtonGroup } from "~/components/Sheet/SheetButtonGroup";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { MediaImage } from "~/modules/media/components/MediaImage";
import type { MediaType } from "~/stores/Playback/types";

type ArtworkSheetProps = { id: string; ref: TrueSheetRef };

/** Sheet allowing us to change the artwork of an album. */
export function AlbumArtworkSheet({ id, ref }: ArtworkSheetProps) {
  const { data } = useAlbum(id);
  return (
    <DetachedSheet ref={ref} contentContainerClassName="items-center">
      <BaseArtworkSheetContent
        type="album"
        imageSource={data?.artwork ?? null}
        onUpdateArtwork={(altArtwork) => updateAlbum(id, { altArtwork })}
        onSuccess={async () => {
          clearAllQueries();
          await Resynchronize.onActiveTrack({ type: "album", id });
        }}
        disabled={data?.altArtwork === null}
      />
    </DetachedSheet>
  );
}

/** Sheet allowing us to change the artwork of an artist. */
export function ArtistArtworkSheet({ id, ref }: ArtworkSheetProps) {
  const qc = useQueryClient();
  const { data } = useArtist(id);
  return (
    <DetachedSheet ref={ref} contentContainerClassName="items-center">
      <BaseArtworkSheetContent
        type="artist"
        imageSource={data?.artwork ?? null}
        onUpdateArtwork={(artwork) => updateArtist(id, { artwork })}
        onSuccess={() => qc.invalidateQueries({ queryKey: q.artists._def })}
      />
    </DetachedSheet>
  );
}

/** Sheet allowing us to change the artwork of an genre. */
export function GenreArtworkSheet({ id, ref }: ArtworkSheetProps) {
  const qc = useQueryClient();
  const { data } = useGenre(id);
  return (
    <DetachedSheet ref={ref} contentContainerClassName="items-center">
      <BaseArtworkSheetContent
        type="genre"
        imageSource={data?.artwork ?? null}
        onUpdateArtwork={(artwork) => updateGenre(id, { artwork })}
        onSuccess={() => qc.invalidateQueries({ queryKey: q.genres._def })}
      />
    </DetachedSheet>
  );
}

/** Sheet allowing us to change the artwork of a playlist. */
export function PlaylistArtworkSheet({ id, ref }: ArtworkSheetProps) {
  const qc = useQueryClient();
  const { data } = usePlaylist(id);
  return (
    <DetachedSheet ref={ref} contentContainerClassName="items-center">
      <BaseArtworkSheetContent
        type="playlist"
        imageSource={data?.artwork ?? null}
        onUpdateArtwork={(artwork) => updatePlaylist(id, { artwork })}
        onSuccess={() => {
          qc.resetQueries({ queryKey: q.playlists._def });
          qc.invalidateQueries({ queryKey: q.tracks._def });
          qc.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
          qc.invalidateQueries({ queryKey: ["search"] });
        }}
      />
    </DetachedSheet>
  );
}

/** Sheet allowing us to change the artwork of a track. */
export function TrackArtworkSheet({ id, ref }: ArtworkSheetProps) {
  const { data } = useTrack(id);
  return (
    <DetachedSheet ref={ref} contentContainerClassName="items-center">
      <BaseArtworkSheetContent
        type="track"
        imageSource={data?.artwork ?? null}
        onUpdateArtwork={(altArtwork) => updateTrack(id, { altArtwork })}
        onSuccess={async () => {
          clearAllQueries();
          await Resynchronize.onActiveTrack({ type: "track", id });
        }}
        disabled={data?.altArtwork === null}
      />
    </DetachedSheet>
  );
}

/** Reusable sheet for changing the artwork of some media. */
function BaseArtworkSheetContent(props: {
  type: MediaType;
  imageSource: MediaImage.ImageSource | MediaImage.ImageSource[];
  onUpdateArtwork: (artwork: string | null) => Promise<unknown>;
  onSuccess: () => Promise<void> | void;
  disabled?: boolean;
}) {
  const { height, width } = useWindowDimensions();
  const [disabled, setDisabled] = useState(false);

  const onSubmit = async (artwork: Promise<string> | null) => {
    setDisabled(true);
    try {
      await wait(1);
      await props.onUpdateArtwork(await artwork);
      await props.onSuccess();
    } catch {}
    setDisabled(false);
  };

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
          onPress: () => onSubmit(null),
          disabled:
            props.disabled ||
            disabled ||
            props.imageSource === null ||
            Array.isArray(props.imageSource),
        }}
        rightButton={{
          textKey: "feat.artwork.extra.change",
          onPress: () => onSubmit(pickImage()),
          disabled,
        }}
      />
    </>
  );
}
