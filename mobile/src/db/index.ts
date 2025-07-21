import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { openDatabaseSync } from "expo-sqlite";

import * as schema from "./schema";
import migrations from "./drizzle/migrations";

export const expoSQLiteDB = openDatabaseSync("db.db");
export const db = drizzle(expoSQLiteDB, { schema, casing: "snake_case" });

// Run migration on app start.
migrate(db, migrations).catch((err) => {
  console.log("Migration failed:", err);
});
