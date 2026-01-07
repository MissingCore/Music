import type { TFunction } from "i18next";

import type { Album, PlaylistWithTracks, Track } from "./schema";
import type {
  Artwork,
  SlimAlbum,
  SlimArtist,
  SlimPlaylistWithTracks,
  TrackArtwork,
} from "./slimTypes";

import i18next from "~/modules/i18n";
import { AlbumArtistsKey } from "~/api/album.utils";

import { formatSeconds } from "~/utils/number";
import type { AtLeast, Prettify } from "~/utils/types";
import { ReservedNames } from "~/modules/media/constants";
import type { MediaCardContent } from "~/modules/media/components/MediaCard.type";
import type { TrackContent } from "~/modules/media/components/Track.type";

//#region Artwork Formatters
/** Get the cover of a playlist. */
export function getPlaylistCover(playlist: {
  artwork: Artwork;
  tracks: TrackArtwork[];
}) {
  return playlist.artwork ?? getCollage(playlist.tracks);
}

/** Get the cover of a track. */
export function getTrackCover({ artwork, album }: TrackArtwork) {
  return artwork ?? album?.artwork ?? null;
}
//#endregion

//#region Artist Junction Table Helpers
/** Generate a string listing out all the artists. */
export function getArtistsString<T extends boolean = true>(
  data: Array<{ artistName: string }>,
  withFallback?: T,
) {
  const _withFallback = withFallback === undefined ? true : withFallback;
  return (
    data.map((t) => t.artistName).join(", ") ||
    ((_withFallback ? "—" : null) as T extends true ? string : string | null)
  );
}
//#endregion

//#region Assorted Helpers
/**
 * Merges 2 arrays of `TrackWithAlbum`. Tracks that appear in both arrays
 * will have their order adjusted to match the 2nd array.
 */
export function mergeTracks<TData extends { id: string }>(
  arr1: TData[],
  arr2: TData[],
) {
  const trackIds = new Set(arr2.map(({ id }) => id));
  return arr1.filter(({ id }) => !trackIds.has(id)).concat(arr2);
}

/** Get the year range from the `year` field on tracks. */
export function getYearRange<TData extends { year: number | null }>(
  entries: TData[],
) {
  const years = entries
    .filter(({ year }) => year !== null)
    .map(({ year }) => year) as number[];
  if (years.length === 0) return { minYear: -1, maxYear: -1, range: null };
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const range = minYear === maxYear ? `${maxYear}` : `${minYear} - ${maxYear}`;
  return { minYear, maxYear, range };
}
//#endregion

//#region Format for Component
type MediaCardFormatter = Prettify<
  { t: TFunction } & (
    | { type: "artist"; data: SlimArtist & { tracks: any[] } }
    | { type: "album"; data: SlimAlbum & { tracks: any[] } }
    | { type: "playlist"; data: SlimPlaylistWithTracks }
  )
>;

/** Format data to be used in `<MediaCard />`. */
export function formatForMediaCard({ type, data, t }: MediaCardFormatter) {
  let source: string | string[] | null = data.artwork;
  let id = data.name;
  let description = t("plural.track", { count: data.tracks.length });
  if (type === "album") {
    id = data.id;
    description = AlbumArtistsKey.toString(data.artistsKey);
  } else if (type === "playlist") {
    source = getPlaylistCover(data);
  }

  return {
    type,
    source,
    id,
    title: data.name,
    description,
  } as MediaCardContent;
}

/** Format data to be used in `<Track />`. */
export function formatForTrack(
  track: AtLeast<Track, "id" | "name" | "artwork"> & {
    album: AtLeast<Album, "artwork"> | null;
    tracksToArtists: Array<{ artistName: string }>;
  },
) {
  const { id, name, tracksToArtists } = track;
  const imageSource = getTrackCover(track);
  const description = getArtistsString(tracksToArtists);

  return { id, imageSource, title: name, description } satisfies TrackContent;
}
//#endregion

//#region Format for Screen
type ScreenFormatter = { t: TFunction; data: PlaylistWithTracks };

/** Format data to be used in the `(current)` routes. */
export function formatForCurrentScreen({ data, t }: ScreenFormatter) {
  return {
    name: data.name,
    imageSource: getPlaylistCover(data),
    metadata: [
      t("plural.track", { count: data.tracks.length }),
      formatSeconds(
        data.tracks.reduce((total, curr) => total + curr.duration, 0),
      ),
    ],
    tracks: data.tracks.map((track) => formatForTrack(track)),
  };
}
//#endregion

//#region Validators
/**
 * Returns sanitize playlist name after checking to see if it's valid based
 * on other metrics. Throws error on failure.
 */
export function sanitizePlaylistName(name: string) {
  const sanitized = name.trim();

  let errMsg: string | undefined;
  if (ReservedNames.has(sanitized)) errMsg = i18next.t("err.msg.usedName");
  if (sanitized.length === 0) errMsg = i18next.t("err.msg.noContent");

  if (errMsg) throw new Error(errMsg);

  return sanitized;
}
//#endregion

//#region Internal Utils
/**
 * Create a collage from the first 4 tracks with artwork. We assume the
 * `TrackWithAlbum[]` passed is already sorted.
 */
function getCollage(tracks: TrackArtwork[]) {
  return tracks
    .map((track) => getTrackCover(track))
    .filter((artwork) => artwork !== null)
    .slice(0, 4);
}
//#endregion
