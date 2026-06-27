// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { openDatabaseSync } from "expo-sqlite";

import * as schema from "./schema";
import migrations from "./drizzle/migrations";

export const expoSQLiteDB = openDatabaseSync("db.db", {
  useNewConnection: true,
});
export const db = drizzle(expoSQLiteDB, { schema, casing: "snake_case" });

// Run migration on app start.
migrate(db, migrations).catch((err) => {
  console.log("Migration failed:", err);
});
