import { eq } from "drizzle-orm";

import { db } from "~/db";
import { tracks } from "~/db/schema";

type InsertedTrack = typeof tracks.$inferInsert;

//#region PATCH Methods
export async function updateTrack(
  id: string,
  values: Partial<Omit<InsertedTrack, "id">>,
) {
  return db.update(tracks).set(values).where(eq(tracks.id, id));
}
//#endregion
