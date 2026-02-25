import type { TFunction } from "i18next";

import type { SlimAlbum, SlimArtist, SlimGenre } from "./slimTypes";

import { AlbumArtistsKey } from "~/data/album/utils";

import type { Prettify } from "~/utils/types";
import type { MediaCardContent } from "~/modules/media/components/MediaCard.type";

//#region Format for Component
type MediaCardFormatter = Prettify<
  { t: TFunction } & (
    | { type: "artist"; data: SlimArtist & { tracks: any[] } }
    | { type: "genre"; data: SlimGenre & { tracks: any[] } }
    | { type: "album"; data: SlimAlbum & { tracks: any[] } }
  )
>;

/** Format data to be used in `<MediaCard />`. */
export function formatForMediaCard({ type, data, t }: MediaCardFormatter) {
  const source: string | string[] | null = data.artwork;
  let id = data.name;
  const title = data.name;
  let description = t("plural.track", { count: data.tracks.length });
  if (type === "album") {
    id = data.id;
    description = AlbumArtistsKey.toString(data.artistsKey);
  }

  return { type, source, id, title, description } as MediaCardContent;
}
//#endregion
