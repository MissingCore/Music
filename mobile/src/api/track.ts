import { and, eq, sql } from "drizzle-orm";

import { db } from "~/db";
import type { Album, Track } from "~/db/schema";
import { albums, tracks, tracksToArtists } from "~/db/schema";

import { viewPreferenceStore } from "~/stores/ViewPreference/store";

import { iAsc, iDesc } from "~/lib/drizzle";
import type { BooleanPriority } from "~/utils/types";
import type { ScreenSortOptions } from "~/stores/ViewPreference/constants";
import { getTrackArtwork } from "./track.utils";
import type { DrizzleFilter, QueriedTrack } from "./types";
import { getColumns, withRelations } from "./utils";

//#region GET Methods
/** Get the genres that this track has. */
export async function getTrackGenres(id: string) {
  const allTrackGenres = await db.query.tracksToGenres.findMany({
    where: (fields, { eq }) => eq(fields.trackId, id),
    columns: { genreName: true },
  });
  return allTrackGenres.map(({ genreName }) => genreName);
}

/** Get the names of the playlists that this track is in. */
export async function getTrackPlaylists(id: string) {
  const allTrackPlaylists = await db.query.tracksToPlaylists.findMany({
    where: (fields, { eq }) => eq(fields.trackId, id),
    columns: { playlistName: true },
  });
  return allTrackPlaylists.map(({ playlistName }) => playlistName);
}

/** Get multiple tracks. */
export async function getTracks<
  TCols extends keyof Track,
  ACols extends keyof Album,
  WithAlbum_User extends boolean | undefined,
>(options?: {
  where?: DrizzleFilter;
  columns?: TCols[];
  albumColumns?: [ACols, ...ACols[]];
  withAlbum?: WithAlbum_User;
}) {
  const allTracks = await db.query.tracks.findMany({
    where: and(...(options?.where ?? [])),
    columns: getColumns(options?.columns),
    ...withRelations({ defaultWithAlbum: true, ...options }),
    orderBy: (fields) => iAsc(fields.name),
  });
  const hasArtwork =
    options?.columns === undefined ||
    options?.columns.includes("artwork" as TCols);
  return allTracks.map((t) => {
    if (hasArtwork) t.artwork = getTrackArtwork(t);
    return t;
  }) as Array<
    QueriedTrack<BooleanPriority<WithAlbum_User, true>, TCols, ACols>
  >;
}

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
