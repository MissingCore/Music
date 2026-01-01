import type { TFunction } from "i18next";

import type {
  Album,
  AlbumWithTracks,
  ArtistWithTracks,
  PlaylistWithTracks,
  Track,
  TrackWithRelations,
} from "./schema";
import type {
  Artwork,
  SlimAlbum,
  SlimArtist,
  SlimPlaylistWithTracks,
  TrackArtwork,
} from "./slimTypes";

import i18next from "~/modules/i18n";

import { formatSeconds } from "~/utils/number";
import { omitKeys } from "~/utils/object";
import type { AtLeast, Prettify } from "~/utils/types";
import { ReservedNames } from "~/modules/media/constants";
import type { MediaCardContent } from "~/modules/media/components/MediaCard.type";
import type { TrackContent } from "~/modules/media/components/Track.type";
import type { MediaType } from "~/stores/Playback/types";

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
export const ARTIST_STRING_FALLBACK = "—";

/** Generate a string listing out all the artists. */
export function getArtistsString<T extends boolean = true>(
  data: Array<{ artistName: string }>,
  withFallback?: T,
) {
  const _withFallback = withFallback === undefined ? true : withFallback;
  return (
    data.join(" • ") ||
    ((_withFallback ? ARTIST_STRING_FALLBACK : null) as T extends true
      ? string
      : string | null)
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
    description = data.artistName;
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
  type: MediaType,
  track: AtLeast<Track, "id" | "name" | "duration" | "artwork"> & {
    album: AtLeast<Album, "name" | "artistName" | "artwork"> | null;
    tracksToArtists: Array<{ artistName: string }>;
  },
) {
  const { id, name, duration, album, tracksToArtists } = track;

  const imageSource = type !== "album" ? getTrackCover(track) : null;
  const artistsString = getArtistsString(tracksToArtists, false);
  let description = artistsString ?? "—";
  if (type === "artist") description = album?.name ?? "—";
  else if (type === "album") {
    description = formatSeconds(duration);
    if (artistsString && album?.artistName !== artistsString) {
      description += ` • ${artistsString}`;
    }
  }

  return { id, imageSource, title: name, description } satisfies TrackContent;
}
//#endregion

//#region Format for Screen
type ScreenFormatter = Prettify<
  { t: TFunction } & (
    | { type: "artist"; data: ArtistWithTracks }
    | { type: "album"; data: AlbumWithTracks }
    | { type: "playlist"; data: PlaylistWithTracks }
  )
>;

type ScreenTrack = TrackContent & {
  disc: number | null;
  track: number | null;
};

/** Format data to be used in the `(current)` routes. */
export function formatForCurrentScreen({ type, data, t }: ScreenFormatter) {
  const metadata = [
    t("plural.track", { count: data.tracks.length }),
    formatSeconds(
      data.tracks.reduce((total, curr) => total + curr.duration, 0),
    ),
  ];
  if (type === "album") {
    const { range } = getYearRange(data.tracks);
    if (range !== null) metadata.unshift(range);
  }

  const albumInfo = type === "album" ? omitKeys(data, ["tracks"]) : null;
  let imgSrc: string | string[] | null = data.artwork;
  if (type === "playlist") imgSrc = getPlaylistCover(data);

  return {
    name: data.name,
    imageSource: imgSrc,
    metadata,
    tracks: (data.tracks as TrackWithRelations[]).map((track) => {
      if (!isTrackWithAlbum(track))
        (track as TrackWithRelations).album = albumInfo;
      const formattedTrack = formatForTrack(type, track) as ScreenTrack;
      formattedTrack.disc = track.disc;
      formattedTrack.track = track.track;
      return formattedTrack;
    }),
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

/** Determines if a `Track` is actually an `TrackWithAlbum`. */
function isTrackWithAlbum(
  track: Track | TrackWithRelations,
): track is TrackWithRelations {
  return Object.hasOwn(track, "album");
}
//#endregion
