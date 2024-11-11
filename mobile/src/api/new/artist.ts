import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import type { ArtistWithTracks } from "@/db/schema";
import { artists } from "@/db/schema";

import i18next from "@/modules/i18n";

import type {
  DrizzleFilter,
  QueryCondition,
  QueryMultiple,
  QuerySingleFn,
} from "./types";

//#region GET Methods
/** Get the specified artist. Throws error by default if no artist is found. */
// @ts-expect-error - Function overloading typing issues [ts(2322)]
export const getArtist: QuerySingleFn<ArtistWithTracks> = async ({
  shouldThrow = true,
  ...opts
}) => {
  let conditions: DrizzleFilter = opts.filters ?? [];
  if (opts.id) conditions.push(eq(artists.name, opts.id));
  const artist = await db.query.artists.findFirst({
    where: and(...conditions),
    with: { tracks: { with: { album: true } } },
  });
  if (shouldThrow && !artist) throw new Error(i18next.t("response.noArtists"));
  return artist;
};

/** Get the albums an artist has released in descending order. */
export async function getArtistAlbums({ id }: { id: string }) {
  return db.query.albums.findMany({
    where: (fields, { eq }) => eq(fields.artistName, id),
    orderBy: (fields, { desc }) => desc(fields.releaseYear),
  });
}

/** Get multiple artists. */
export async function getArtists(args?: QueryMultiple) {
  return db.query.artists.findMany({
    where: and(...(args?.filters ?? [])),
    with: { tracks: { with: { album: true } } },
  });
}
//#endregion

//#region POST Methods
/** Create a new artist entry. */
export async function createArtist(artistEntry: typeof artists.$inferInsert) {
  return db.insert(artists).values(artistEntry).onConflictDoNothing();
}
//#endregion

//#region DELETE Methods
/** Delete specified artist. */
export async function deleteArtist(args: QueryCondition) {
  let conditions: DrizzleFilter = args.filters ?? [];
  if (args.id) conditions.push(eq(artists.name, args.id));
  return db.delete(artists).where(and(...conditions));
}
//#endregion
