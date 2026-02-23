import { eq } from "drizzle-orm";

import { db } from "~/db";
import { artists } from "~/db/schema";

//#region POST Methods
/** Create new artist entries. */
export async function createArtists(
  entries: Array<typeof artists.$inferInsert>,
) {
  return db.insert(artists).values(entries).onConflictDoNothing();
}
//#endregion

//#region PATCH Methods
/** Update specified artist. */
export async function updateArtist(
  id: string,
  values: Partial<Omit<typeof artists.$inferInsert, "name">>,
) {
  return db.update(artists).set(values).where(eq(artists.name, id));
}
//#endregion
