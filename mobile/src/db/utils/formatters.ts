import type {
  AlbumWithTracks,
  ArtistWithTracks,
  PlaylistWithJunction,
  PlaylistWithTracks,
  Track,
  TrackWithAlbum,
} from "../schema";

import i18next from "@/modules/i18n";

import { formatSeconds } from "@/utils/number";
import type { MediaCard } from "@/components/media/card";
import { ReservedPlaylists } from "@/modules/media/constants";
import type { Track as TrackC } from "@/modules/media/components";
import { isTrackWithAlbum } from "./narrowing";
import { sortTracks } from "./sorting";

/** General input type for data formatting. */
type FnArgs =
  | { type: "artist"; data: ArtistWithTracks }
  | { type: "album"; data: AlbumWithTracks }
  | { type: "playlist"; data: PlaylistWithTracks };
type FnArgsWithTrack = FnArgs | { type: "track"; data: TrackWithAlbum[] };

/** Get the covers of the first 4 tracks. */
export function getPlaylistCollage(data: TrackWithAlbum[]) {
  return data
    .map((data) => ({ name: data.name, artwork: getTrackCover(data) }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 4)
    .map(({ artwork }) => artwork);
}

/** Get the cover of a playlist. */
export function getPlaylistCover(data: PlaylistWithTracks) {
  return data.artwork ?? getPlaylistCollage(data.tracks);
}

/** Get the cover of a track with `album` field. */
export function getTrackCover(data: TrackWithAlbum) {
  return data.album?.artwork ?? data.artwork;
}

/** Replace the "junction" field from the `Playlist` table with `tracks`. */
export function fixPlaylistJunction(
  data: PlaylistWithJunction,
): PlaylistWithTracks {
  const { tracksToPlaylists, ...rest } = data;
  return { ...rest, tracks: tracksToPlaylists.map(({ track }) => track) };
}

/** Formats data to be used with `<MediaCard />`. */
export function formatForMediaCard({ type, data }: FnArgs): MediaCard.Content {
  const trackStr = i18next.t("plural.track", { count: data.tracks.length });
  return {
    type,
    source:
      type === "album"
        ? data.artwork
        : type === "playlist" && data.name !== ReservedPlaylists.tracks
          ? getPlaylistCover(data)
          : null,
    href:
      type === "album"
        ? `/album/${data.id}`
        : type === "playlist" && data.name === ReservedPlaylists.tracks
          ? "/track"
          : `/${type}/${encodeURIComponent(data.name)}`,
    title: data.name,
    subtitle: type === "album" ? data.artistName : trackStr,
    extra: type === "album" ? `| ${trackStr}` : null,
  } as MediaCard.Content;
}

/** Formats tracks data to be used with `<Track />`. */
export function formatTracksForTrack({
  type,
  data,
}: FnArgsWithTrack): TrackC.Content[] {
  const tracks: Track[] | TrackWithAlbum[] =
    type === "track" ? data : data.tracks;

  return sortTracks({ type, tracks }).map((data) => {
    const { id, duration, artwork, name, artistName } = data;

    let imageSource = artwork;
    const textContent: TrackC.Content["textContent"] = [name, artistName];

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

/** Return shared fields used for data in `(current)` routes. */
export function formatForCurrentPages(args: FnArgs) {
  const { type, data } = args;
  const metadata = [
    i18next.t("plural.track", { count: data.tracks.length }),
    formatSeconds(
      data.tracks.reduce((total, curr) => total + curr.duration, 0),
      { format: "duration", omitSeconds: true },
    ),
  ];
  if (type === "album" && data.releaseYear) {
    metadata.unshift(String(data.releaseYear));
  }

  return { name: data.name, metadata, tracks: formatTracksForTrack(args) };
}

/** Return an array of track ids. */
export function formatAsTrackIdList(tracks: Track[]) {
  return tracks.map(({ id }) => id);
}
