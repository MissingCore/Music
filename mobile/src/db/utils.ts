import type { TFunction } from "i18next";

import type {
  SlimAlbum,
  SlimArtist,
  SlimGenre,
  SlimPlaylistWithTracks,
} from "./slimTypes";

import { getPlaylistArtwork } from "~/api/playlist.utils";
import { AlbumArtistsKey } from "~/data/album/utils";

import type { Prettify } from "~/utils/types";
import type { MediaCardContent } from "~/modules/media/components/MediaCard.type";
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
//#endregion
