import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import type { ArtistWithTracks } from "@/db/schema";
import { artists } from "@/db/schema";

import i18next from "@/modules/i18n";

import type { DrizzleFilter, QuerySingleFn } from "./types";

//#region GET Methods
/** Get specified artist. Throws error by default if nothing is found. */
// @ts-expect-error - Function overloading typing issues [ts(2322)]
export const getArtist: QuerySingleFn<ArtistWithTracks> = async (
  id,
  shouldThrow = true,
) => {
  const artist = await db.query.artists.findFirst({
    where: eq(artists.name, id),
    with: { tracks: { with: { album: true } } },
  });
  if (shouldThrow && !artist) throw new Error(i18next.t("response.noArtists"));
  return artist;
};

/** Get the albums an artist has released in descending order. */
export async function getArtistAlbums(id: string) {
  return db.query.albums.findMany({
    where: (fields, { eq }) => eq(fields.artistName, id),
    orderBy: (fields, { desc }) => desc(fields.releaseYear),
  });
}

/** Get multiple artists. */
export async function getArtists(where: DrizzleFilter = []) {
  return db.query.artists.findMany({
    where: and(...where),
    with: { tracks: { with: { album: true } } },
  });
}
//#endregion

//#region POST Methods
/** Create a new artist entry. */
export async function createArtist(entry: typeof artists.$inferInsert) {
  return db.insert(artists).values(entry).onConflictDoNothing();
}
//#endregion

//#region DELETE Methods
/** Delete specified artist. */
export async function deleteArtist(id: string) {
  return db.delete(artists).where(eq(artists.name, id));
}
//#endregion
