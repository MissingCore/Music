import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

import * as schema from "./schema";

export const expoSQLiteDB = openDatabaseSync("db.db");
export const db = drizzle(expoSQLiteDB, { schema });
