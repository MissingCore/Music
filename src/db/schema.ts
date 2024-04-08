import type { InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createId } from "@/lib/cuid2";

export const artists = sqliteTable("artists", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
});
export type Artist = InferSelectModel<typeof artists>;

export const artistsRelations = relations(artists, ({ many }) => ({
  albums: many(albums),
  tracks: many(tracks),
}));

export const albums = sqliteTable("albums", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  artistId: text("artistId")
    .notNull()
    .references(() => artists.id),
  name: text("name").notNull(),
  coverSrc: text("coverSrc"),
  releaseYear: integer("releaseYear"),
  isFavorite: integer("isFavorite", { mode: "boolean" })
    .notNull()
    .default(false),
});
export type Album = InferSelectModel<typeof albums>;

export const albumsRelations = relations(albums, ({ one, many }) => ({
  artist: one(artists, { fields: [albums.artistId], references: [artists.id] }),
  tracks: many(tracks),
}));

export const tracks = sqliteTable("tracks", {
  id: text("id").primaryKey(),
  artistId: text("artistId")
    .notNull()
    .references(() => artists.id),
  albumId: text("albumId").references(() => albums.id),
  name: text("name").notNull(),
  coverSrc: text("coverSrc"),
  track: integer("track").notNull().default(-1), // Track number in album if available
  duration: integer("duration").notNull(), // Track duration in seconds
  isFavorite: integer("isFavorite", { mode: "boolean" })
    .notNull()
    .default(false),
  uri: text("uri").notNull(),
  modificationTime: integer("modificationTime").notNull(),
});
export type Track = InferSelectModel<typeof tracks>;

export const tracksRelations = relations(tracks, ({ one }) => ({
  artist: one(artists, { fields: [tracks.artistId], references: [artists.id] }),
  album: one(albums, { fields: [tracks.albumId], references: [albums.id] }),
}));

export const invalidTracks = sqliteTable("invalidTracks", {
  id: text("id").primaryKey(),
  uri: text("uri").notNull(),
  modificationTime: integer("modificationTime").notNull(),
});
export type InvalidTrack = InferSelectModel<typeof invalidTracks>;
