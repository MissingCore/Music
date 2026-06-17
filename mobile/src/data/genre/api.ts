import { eq } from "drizzle-orm";

import { db } from "~/db";
import { genres } from "~/db/schema";

type InsertedGenre = typeof genres.$inferInsert;

//#region POST Methods
export async function createGenres(entries: InsertedGenre[]) {
  return db.insert(genres).values(entries).onConflictDoNothing();
}
//#endregion

//#region PATCH Methods
export async function updateGenre(
  id: string,
  values: Partial<Omit<InsertedGenre, "name">>,
) {
  return db.update(genres).set(values).where(eq(genres.name, id));
}
//#endregion
