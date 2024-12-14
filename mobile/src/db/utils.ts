import type { TFunction } from "i18next";

import type {
  AlbumWithTracks,
  ArtistWithTracks,
  PlaylistWithTracks,
  Track,
  TrackWithAlbum,
} from "./schema";

import i18next from "@/modules/i18n";

import { formatSeconds } from "@/utils/number";
import { omitKeys } from "@/utils/object";
import type { Prettify } from "@/utils/types";
import { ReservedNames, ReservedPlaylists } from "@/modules/media/constants";
import type { MediaCard, Track as TrackC } from "@/modules/media/components";
import type { MediaType } from "@/modules/media/types";

//#region Artwork Formatters
/** Get the cover of a playlist. */
export function getPlaylistCover(playlist: PlaylistWithTracks) {
  return playlist.artwork ?? getCollage(playlist.tracks);
}

/** Get the cover of a track. */
export function getTrackCover(track: TrackWithAlbum) {
  return track.artwork ?? track.album?.artwork ?? null;
}
//#endregion

type MediaData = Prettify<
  { t: TFunction } & (
    | { type: "artist"; data: ArtistWithTracks }
    | { type: "album"; data: AlbumWithTracks }
    | { type: "playlist"; data: PlaylistWithTracks }
  )
>;

//#region Format for Component
/** Format data to be used in `<MediaCard />`. */
export function formatForMediaCard({ type, data, t }: MediaData) {
  let source = null;
  let href = `/${type}/${encodeURIComponent(data.name)}`;
  let subtitle = t("plural.track", { count: data.tracks.length });
  if (type === "album") {
    source = data.artwork;
    href = `/album/${data.id}`;
    subtitle = data.artistName;
  } else if (type === "playlist") {
    source = getPlaylistCover(data);
    if (data.name === ReservedPlaylists.tracks) href = "/track";
  }

  return {
    ...{ type, source, href, title: data.name, subtitle },
  } as MediaCard.Content;
}

/** Format data to be used in `<Track />`. */
export function formatForTrack(type: MediaType, track: TrackWithAlbum) {
  const { id, name, artistName, duration, album } = track;

  const imageSource = type !== "album" ? getTrackCover(track) : null;
  let description = artistName ?? "—";
  if (type === "artist") description = album?.name ?? "—";
  else if (type === "album") {
    description = formatSeconds(duration);
    if (artistName && album!.artistName !== artistName) {
      description += ` • ${artistName}`;
    }
  }

  return { id, imageSource, title: name, description } satisfies TrackC.Content;
}
//#endregion

//#region Format for Screen
/** Format data to be used in the `(current)` routes. */
export function formatForCurrentScreen({ type, data, t }: MediaData) {
  const metadata = [
    t("plural.track", { count: data.tracks.length }),
    formatSeconds(
      data.tracks.reduce((total, curr) => total + curr.duration, 0),
    ),
  ];
  if (type === "album" && data.releaseYear) {
    metadata.unshift(String(data.releaseYear));
  }

  const albumInfo = type === "album" ? omitKeys(data, ["tracks"]) : null;

  return {
    name: data.name,
    metadata,
    tracks: data.tracks.map((track) => ({
      ...formatForTrack(
        type,
        isTrackWithAlbum(track) ? track : { ...track, album: albumInfo },
      ),
      ...{ disc: track.disc, track: track.track },
    })),
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
  if (ReservedNames.has(sanitized)) errMsg = i18next.t("response.usedName");

  if (errMsg) throw new Error(errMsg);

  return sanitized;
}
//#endregion

//#region Internal Utils
/**
 * Create a collage from the first 4 tracks with artwork. We assume the
 * `TrackWithAlbum[]` passed is already sorted.
 */
function getCollage(tracks: TrackWithAlbum[]) {
  return tracks
    .map((track) => getTrackCover(track))
    .filter((artwork) => artwork !== null)
    .slice(0, 4);
}

/** Determines if a `Track` is actually an `TrackWithAlbum`. */
function isTrackWithAlbum(
  track: Track | TrackWithAlbum,
): track is TrackWithAlbum {
  return Object.hasOwn(track, "album");
}
//#endregion
