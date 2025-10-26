import type { AddTrack } from "@weights-ai/react-native-track-player";

import type { TrackWithAlbum } from "~/db/schema";
import { getTrackCover } from "~/db/utils";

import i18next from "~/modules/i18n";
import { getAlbum } from "~/api/album";
import type { PlayFromSource } from "./types";

import { getSafeUri } from "~/utils/string";
import { ReservedNames, ReservedPlaylists } from "~/modules/media/constants";

/** Check if 2 `PlayFromSource` are equivalent. */
export function arePlaybackSourceEqual(
  source1: PlayFromSource | undefined,
  source2: PlayFromSource,
) {
  if (!source1) return false;
  const keys = Object.keys(source1) as Array<keyof PlayFromSource>;
  return keys.every((key) => source1[key] === source2[key]);
}

/** Extract the track id if formatted as `${track_id}__${unique_id}`. */
export function extractTrackId(key: string) {
  return key.split("__")[0]!;
}

/** Format track data to be used with the RNTP queue. */
export function formatTrackforPlayer(track: TrackWithAlbum) {
  return {
    url: getSafeUri(track.uri),
    artwork: getTrackCover(track) ?? undefined,
    title: track.name,
    artist: track.artistName ?? "No Artist",
    duration: track.duration,
    id: track.id,
  } satisfies AddTrack;
}

/** Returns the name of the `PlayFromSource`. */
export async function getSourceName({ type, id }: PlayFromSource) {
  let name = "";
  try {
    if (ReservedNames.has(id)) {
      const tKey = id === ReservedPlaylists.tracks ? "t" : "favoriteT";
      name = i18next.t(`term.${tKey}racks`);
    } else if (type === "artist" || type === "playlist") {
      name = id;
    } else if (type === "folder") {
      // FIXME: At `-2` index due to the folder path (in `id`) ending with
      // a trailing slash.
      name = id.split("/").at(-2) ?? "";
    } else {
      name = (await getAlbum(id, { columns: ["name"], withTracks: false }))
        .name;
    }
  } catch {}
  return name;
}
