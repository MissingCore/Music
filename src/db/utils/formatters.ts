import type {
  AlbumWithTracks,
  ArtistWithTracks,
  PlaylistWithJunction,
  PlaylistWithTracks,
  Track,
  TrackWithAlbum,
} from "../schema";

import type { MediaCardContent } from "@/components/media/MediaCard";
import { getPlayTime } from "@/components/media/utils";
import { SpecialPlaylists } from "@/features/playback/constants";
import type { TrackCardContent } from "@/features/track/components/TrackCard";
import { getTrackCountStr } from "@/features/track/utils";
import { isTrackWithAlbum } from "./narrowing";
import { sortTracks } from "./sorting";

/** @description General input type for data formatting. */
type FnArgs =
  | { type: "artist"; data: ArtistWithTracks }
  | { type: "album"; data: AlbumWithTracks }
  | { type: "playlist"; data: PlaylistWithTracks };
type FnArgsWithTrack = FnArgs | { type: "track"; data: TrackWithAlbum[] };

/** @description Get the covers of the first 4 tracks. */
export function getPlaylistCollage(data: TrackWithAlbum[]) {
  return data
    .map((data) => ({ name: data.name, coverSrc: getTrackCover(data) }))
    .toSorted((a, b) => a.name.localeCompare(b.name))
    .slice(0, 4)
    .map(({ coverSrc }) => coverSrc);
}

/** @description Get the cover of a playlist. */
export function getPlaylistCover(data: PlaylistWithTracks) {
  return data.coverSrc ?? getPlaylistCollage(data.tracks);
}

/** @description Get the cover of a track with `album` field. */
export function getTrackCover(data: TrackWithAlbum) {
  return data.album?.coverSrc ?? data.coverSrc;
}

/**
 * @description Replace the "junction" field from the `Playlist` table
 *  with `tracks`.
 */
export function fixPlaylistJunction(
  data: PlaylistWithJunction,
): PlaylistWithTracks {
  const { tracksToPlaylists, ...rest } = data;
  return { ...rest, tracks: tracksToPlaylists.map(({ track }) => track) };
}

/** @description Formats data to be used with `<MediaCard />`. */
export function formatForMediaCard({ type, data }: FnArgs) {
  const trackStr = getTrackCountStr(data.tracks.length);
  return {
    type,
    source:
      type === "album"
        ? data.coverSrc
        : type === "playlist" && data.name !== SpecialPlaylists.tracks
          ? getPlaylistCover(data)
          : null,
    href:
      type === "album"
        ? `/album/${data.id}`
        : type === "playlist" && data.name === SpecialPlaylists.tracks
          ? "/track"
          : `/${type}/${data.name}`,
    title: data.name,
    subtitle: type !== "album" ? trackStr : data.artistName,
    extra: type === "album" ? `| ${trackStr}` : null,
  } as MediaCardContent;
}

/**
 * @description Formats tracks data to be used with `<TrackCard />` or
 *  `<ActionButton />`.
 */
export function formatTracksForTrackCard({
  type,
  data,
}: FnArgsWithTrack): TrackCardContent[] {
  const tracks: Track[] | TrackWithAlbum[] =
    type === "track" ? data : data.tracks;

  return sortTracks({ type, tracks }).map((data) => {
    const { id, duration, coverSrc, name, artistName } = data;

    let imageSource = coverSrc;
    const textContent: TrackCardContent["textContent"] = [name, artistName];

    if (!isTrackWithAlbum(data)) {
      // Only true when `type === "album"`.
      imageSource = null;
      textContent[1] =
        data.track > 0 ? `Track ${`${data.track}`.padStart(2, "0")}` : "Track";
    } else {
      imageSource = getTrackCover(data);
      if (type === "artist") textContent[1] = data.album?.name ?? "Single";
    }

    return { textContent, id, imageSource, duration };
  });
}

/** @description Return shared fields used for data in `(current)` routes. */
export function formatForCurrentPages(args: FnArgs) {
  const { type, data } = args;
  const metadata = [
    getTrackCountStr(data.tracks.length),
    getPlayTime(data.tracks.reduce((total, curr) => total + curr.duration, 0)),
  ];
  if (type === "album" && data.releaseYear) {
    metadata.unshift(String(data.releaseYear));
  }

  return { name: data.name, metadata, tracks: formatTracksForTrackCard(args) };
}

/** @description Return an array of track ids. */
export function formatAsTrackIdList(tracks: Track[]) {
  return tracks.map(({ id }) => id);
}
