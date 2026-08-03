// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

import * as schema from "./schema";

export const expoSQLiteDB = openDatabaseSync("db.db", {
  useNewConnection: true,
});

export const db = drizzle(expoSQLiteDB, { schema, casing: "snake_case" });
