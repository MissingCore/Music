import { createId } from "@paralleldrive/cuid2";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import type { ColorScheme } from "./constants";

export const customThemes = sqliteTable("custom_themes", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text().notNull(),
  scheme: text().$type<ColorScheme>().notNull().default("light"),

  primary: text().notNull(),
  onPrimary: text().notNull(),
  onPrimaryVariant: text().notNull(),
  secondary: text().notNull(),
  onSecondary: text().notNull(),
  onSecondaryVariant: text().notNull(),
  error: text().notNull(),
  onError: text().notNull(),
  onErrorVariant: text().notNull(),

  primaryDim: text().notNull(),
  secondaryDim: text().notNull(),
  errorDim: text().notNull(),

  surfaceDim: text().notNull(),
  surface: text().notNull(),
  surfaceBright: text().notNull(),

  surfaceContainerLowest: text().notNull(),
  surfaceContainerLow: text().notNull(),
  surfaceContainer: text().notNull(),
  surfaceContainerHigh: text().notNull(),
  surfaceContainerHighest: text().notNull(),

  onSurface: text().notNull(),
  onSurfaceVariant: text().notNull(),
  outline: text().notNull(),
  outlineVariant: text().notNull(),

  inverseSurface: text().notNull(),
  inverseOnSurface: text().notNull(),
});
