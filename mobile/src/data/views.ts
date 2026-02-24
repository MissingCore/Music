import { db } from "~/db";
import { tracksToArtists } from "~/db/schema";

import { iAsc } from "~/lib/drizzle";

/**
 * Order the `tracksToArtists` table by artist names. Used for ensuring
 * artist name order when generating the `artists` field on tracks.
 */
export function getOrderedTrackArtistsView() {
  return db
    .select()
    .from(tracksToArtists)
    .orderBy(iAsc(tracksToArtists.artistName))
    .as("ordered_track_artists_view");
}
