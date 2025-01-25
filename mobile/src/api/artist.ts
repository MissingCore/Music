import { and, eq } from "drizzle-orm";

import { db } from "~/db";
import type { Artist, ArtistWithTracks, Track } from "~/db/schema";
import { artists } from "~/db/schema";

import i18next from "~/modules/i18n";

import { iAsc } from "~/lib/drizzle";
import { deleteImage } from "~/lib/file-system";
import type {
  DrizzleFilter,
  QueryManyWithTracksResult,
  QueryOneWithTracksResult,
} from "./types";
import { getColumns } from "./utils";

//#region GET Methods
/** Get specified artist. Throws error if nothing is found. */
export async function getArtist<
  DCols extends keyof Artist,
  TCols extends keyof Track,
>(id: string, options?: { columns?: DCols[]; trackColumns?: TCols[] }) {
  const artist = await db.query.artists.findFirst({
    where: eq(artists.name, id),
    columns: getColumns(options?.columns),
    with: {
      tracks: {
        columns: getColumns(options?.trackColumns),
        with: { album: true },
        orderBy: (fields) => iAsc(fields.name),
      },
    },
  });
  if (!artist) throw new Error(i18next.t("response.noArtists"));
  return artist as QueryOneWithTracksResult<
    ArtistWithTracks,
    DCols,
    TCols | "album",
    true
  >;
}

/** Get the albums an artist has released in descending order. */
export async function getArtistAlbums(id: string) {
  return db.query.albums.findMany({
    where: (fields, { eq }) => eq(fields.artistName, id),
    orderBy: (fields, { desc }) => desc(fields.releaseYear),
  });
}

/** Get multiple artists. */
export async function getArtists<
  DCols extends keyof Artist,
  TCols extends keyof Track,
>(options?: {
  where?: DrizzleFilter;
  columns?: DCols[];
  trackColumns?: TCols[];
}) {
  return db.query.artists.findMany({
    where: and(...(options?.where ?? [])),
    columns: getColumns(options?.columns),
    with: {
      tracks: {
        columns: getColumns(options?.trackColumns),
        with: { album: true },
        orderBy: (fields) => iAsc(fields.name),
      },
    },
    orderBy: (fields) => iAsc(fields.name),
  }) as Promise<
    QueryManyWithTracksResult<ArtistWithTracks, DCols, TCols | "album", true>
  >;
}
//#endregion

//#region POST Methods
/** Create a new artist entry. */
export async function createArtist(entry: typeof artists.$inferInsert) {
  return db.insert(artists).values(entry).onConflictDoNothing();
}
//#endregion

//#region PATCH Methods
/** Update specified artist. */
export async function updateArtist(
  id: string,
  values: Partial<typeof artists.$inferInsert>,
) {
  const oldValue = await getArtist(id, {
    columns: ["artwork"],
    trackColumns: [],
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name: _, ...rest } = values;
  return db.transaction(async (tx) => {
    await tx.update(artists).set(rest).where(eq(artists.name, id));
    // Delete the old artwork if we changed it (`null` means we've removed it).
    if (rest.artwork !== undefined) await deleteImage(oldValue.artwork);
  });
}
//#endregion

//#region DELETE Methods
/** Delete specified artist. */
export async function deleteArtist(id: string) {
  return db.delete(artists).where(eq(artists.name, id));
}
//#endregion
