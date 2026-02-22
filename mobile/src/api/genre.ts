import { eq } from "drizzle-orm";

import { db } from "~/db";
import { genres } from "~/db/schema";

//#region POST Methods
export async function createGenres(entries: Array<typeof genres.$inferInsert>) {
  return db.insert(genres).values(entries).onConflictDoNothing();
}
//#endregion

//#region PATCH Methods
export async function updateGenre(
  id: string,
  values: Partial<Omit<typeof genres.$inferInsert, "name">>,
) {
  return db.update(genres).set(values).where(eq(genres.name, id));
}
//#endregion
