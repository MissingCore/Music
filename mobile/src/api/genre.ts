import { db } from "~/db";
import { genres } from "~/db/schema";

//#region POST Methods
export async function createGenres(entries: Array<typeof genres.$inferInsert>) {
  return db.insert(genres).values(entries).onConflictDoNothing();
}
//#endregion
