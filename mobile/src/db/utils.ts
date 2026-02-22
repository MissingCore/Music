import type { TFunction } from "i18next";

import type { Album, Track } from "./schema";
import type {
  SlimAlbum,
  SlimArtist,
  SlimGenre,
  SlimPlaylistWithTracks,
} from "./slimTypes";

import { AlbumArtistsKey } from "~/api/album.utils";
import { getArtistsString } from "~/api/artist.utils";
import { getPlaylistArtwork } from "~/api/playlist.utils";
import { getTrackArtwork } from "~/api/track.utils";

import type { AtLeast, Prettify } from "~/utils/types";
import type { MediaCardContent } from "~/modules/media/components/MediaCard.type";
import type { TrackContent } from "~/modules/media/components/Track.type";
import { FavoritesPlaylistKey } from "~/modules/media/constants";

//#region Format for Component
type MediaCardFormatter = Prettify<
  { t: TFunction } & (
    | { type: "artist"; data: SlimArtist & { tracks: any[] } }
    | { type: "genre"; data: SlimGenre & { tracks: any[] } }
    | { type: "album"; data: SlimAlbum & { tracks: any[] } }
    | { type: "playlist"; data: SlimPlaylistWithTracks }
  )
>;

/** Format data to be used in `<MediaCard />`. */
export function formatForMediaCard({ type, data, t }: MediaCardFormatter) {
  let source: string | string[] | null = data.artwork;
  let id = data.name;
  let title = data.name;
  let description = t("plural.track", { count: data.tracks.length });
  if (type === "album") {
    id = data.id;
    description = AlbumArtistsKey.toString(data.artistsKey);
  } else if (type === "playlist") {
    if (data.name === FavoritesPlaylistKey) title = t("term.favoriteTracks");
    source = getPlaylistArtwork(data);
  }

  return { type, source, id, title, description } as MediaCardContent;
}

/** Format data to be used in `<Track />`. */
export function formatForTrack(
  track: AtLeast<Track, "id" | "name" | "artwork"> & {
    album: AtLeast<Album, "artwork"> | null;
    tracksToArtists: Array<{ artistName: string }>;
  },
) {
  const { id, name, tracksToArtists } = track;
  const imageSource = getTrackArtwork(track);
  const description = getArtistsString(tracksToArtists);

  return { id, imageSource, title: name, description } satisfies TrackContent;
}
//#endregion
