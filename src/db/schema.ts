import type { InferSelectModel } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const artists = sqliteTable("artists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});
export type Artist = InferSelectModel<typeof artists>;

export const albums = sqliteTable("albums", {
  id: text("id").primaryKey(),
  artistId: text("artistId").references(() => artists.id),
  name: text("name").notNull(),
  coverSrc: text("coverSrc"),
  releaseYear: integer("releaseYear"),
  isFavorite: integer("isFavorite", { mode: "boolean" }).default(false),
});
export type Album = InferSelectModel<typeof albums>;

export const tracks = sqliteTable("tracks", {
  id: text("id").primaryKey(),
  artistId: text("artistId").references(() => artists.id),
  albumId: text("albumId").references(() => albums.id),
  name: text("name").notNull(),
  coverSrc: text("coverSrc"),
  track: integer("track").default(-1), // Track number in album if available
  duration: integer("duration").notNull(), // Track duration in seconds
  isFavorite: integer("isFavorite", { mode: "boolean" }).default(false),
  uri: text("uri").notNull(),
});
export type Track = InferSelectModel<typeof tracks>;
