import { eq, sql } from "drizzle-orm";

import { db } from "~/db";
import { albums, tracks, tracksToArtists } from "~/db/schema";

import { viewPreferenceStore } from "~/stores/ViewPreference/store";

import { iAsc, iDesc } from "~/lib/drizzle";
import type { ScreenSortOptions } from "~/stores/ViewPreference/constants";

//#region GET Methods
export type SortedTracksMode = "sortedIds" | "sortedTracks";

export type PreSortedTrack = {
  id: string;
  name: string;
  artistName: string | null;
  albumName: string | null;
  duration: number;
  discoverTime: number;
  modificationTime: number;
  artwork: string | null;
};

/** Return the tracks sorted by the View Preferences. */
export async function getSortedTracks<
  TMode extends SortedTracksMode = "sortedTracks",
>(
  mode?: TMode,
  sortOptions?: { isAsc: boolean; order: ScreenSortOptions<"track"> },
) {
  const { trackIsAsc, trackOrder } = viewPreferenceStore.getState();

  const isAsc = sortOptions?.isAsc ?? trackIsAsc;
  const order = sortOptions?.order ?? trackOrder;

  //? Subquery to order the track artists before we use `GROUP_CONCAT` on them.
  const orderedTrackArtists = db
    .select({
      trackId: tracksToArtists.trackId,
      artistName:
        sql<string>`GROUP_CONCAT(${tracksToArtists.artistName}, ', ')`.as(
          "joined_artistname",
        ),
    })
    .from(tracksToArtists)
    .orderBy(iAsc(tracksToArtists.trackId), iAsc(tracksToArtists.artistName))
    .groupBy(tracksToArtists.trackId)
    .as("ordered_track_artists");
  //? Determine field we'll sort by.
  const sortField =
    order === "albumName"
      ? albums.name
      : order === "artistName"
        ? orderedTrackArtists.artistName
        : tracks[order];

  return db
    .select(
      mode === "sortedIds"
        ? { id: tracks.id }
        : {
            id: tracks.id,
            name: tracks.name,
            artistName: orderedTrackArtists.artistName,
            albumName: albums.name,
            duration: tracks.duration,
            discoverTime: tracks.discoverTime,
            modificationTime: tracks.modificationTime,
            artwork: sql<
              string | null
            >`coalesce(${tracks.artwork}, ${albums.artwork})`,
          },
    )
    .from(tracks)
    .leftJoin(orderedTrackArtists, eq(tracks.id, orderedTrackArtists.trackId))
    .leftJoin(albums, eq(tracks.albumId, albums.id))
    .groupBy(tracks.id)
    .orderBy(isAsc ? iAsc(sortField) : iDesc(sortField)) as unknown as Promise<
    TMode extends "sortedIds" ? Array<{ id: string }> : PreSortedTrack[]
  >;
}
//#endregion
