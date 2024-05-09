import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

import * as schema from "./schema";

const expo = openDatabaseSync("db.db");
export const db = drizzle(expo, { schema });
