import { createId } from "@paralleldrive/cuid2";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const customFonts = sqliteTable("custom_fonts", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text().notNull(),
  uri: text().notNull(),
});

export type CustomFont = typeof customFonts.$inferSelect;
