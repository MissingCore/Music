import { createId } from "@paralleldrive/cuid2";
import type { InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

import type { Prettify } from "~/utils/types";

export const artists = sqliteTable("artists", {
  name: text().primaryKey(),
  artwork: text(),
});

export const artistsRelations = relations(artists, ({ many }) => ({
  albums: many(albums),
  tracks: many(tracks),
}));

export const albums = sqliteTable(
  "albums",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text().notNull(),
    // The `artistName` is the album artist.
    artistName: text("artist_name")
      .notNull()
      .references(() => artists.name),
    /*
      FIXME: This is technically `.notNull()`, but the migration will fail
      for users who have "duplicate" album where `releaseYear = null`.
    */
    releaseYear: integer("release_year").default(-1),
    artwork: text(),
    altArtwork: text(),
    isFavorite: integer({ mode: "boolean" }).notNull().default(false),
  },
  (t) => [unique().on(t.name, t.artistName, t.releaseYear)],
);

export const albumsRelations = relations(albums, ({ one, many }) => ({
  artist: one(artists, {
    fields: [albums.artistName],
    references: [artists.name],
  }),
  tracks: many(tracks),
}));

export const tracks = sqliteTable("tracks", {
  id: text().primaryKey(),
  name: text().notNull(),
  artistName: text().references(() => artists.name),
  albumId: text().references(() => albums.id),
  artwork: text(),
  isFavorite: integer({ mode: "boolean" }).notNull().default(false),
  duration: integer().notNull(), // Track duration in seconds
  // Album relations
  disc: integer(),
  track: integer(),
  // Other metadata
  format: text(), // Currently the mimetype of the file
  bitrate: integer(),
  sampleRate: integer(),
  size: integer().notNull(),
  uri: text().notNull(),
  modificationTime: integer().notNull(),
  // Data checking fields.
  fetchedArt: integer({ mode: "boolean" }).notNull().default(false),
});

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  artist: one(artists, {
    fields: [tracks.artistName],
    references: [artists.name],
  }),
  album: one(albums, { fields: [tracks.albumId], references: [albums.id] }),
  tracksToPlaylists: many(tracksToPlaylists),
}));

export const invalidTracks = sqliteTable("invalid_tracks", {
  id: text().primaryKey(),
  uri: text().notNull(),
  errorName: text(),
  errorMessage: text(),
  modificationTime: integer().notNull(),
});

export const playlists = sqliteTable("playlists", {
  name: text().primaryKey(),
  artwork: text(),
  isFavorite: integer({ mode: "boolean" }).notNull().default(false),
});

export const playlistsRelations = relations(playlists, ({ many }) => ({
  tracksToPlaylists: many(tracksToPlaylists),
}));

export const tracksToPlaylists = sqliteTable(
  "tracks_to_playlists",
  {
    trackId: text()
      .notNull()
      .references(() => tracks.id),
    playlistName: text()
      .notNull()
      .references(() => playlists.name),
    position: integer().notNull().default(-1),
  },
  (t) => [primaryKey({ columns: [t.trackId, t.playlistName] })],
);

export const tracksToPlaylistsRelations = relations(
  tracksToPlaylists,
  ({ one }) => ({
    playlist: one(playlists, {
      fields: [tracksToPlaylists.playlistName],
      references: [playlists.name],
    }),
    track: one(tracks, {
      fields: [tracksToPlaylists.trackId],
      references: [tracks.id],
    }),
  }),
);

export const fileNodes = sqliteTable("file_node", {
  // Excludes the `file:///` at the beginning. Ends with a trailing `/`.
  path: text().primaryKey(),
  // `null` if `path = "Music"`. Ends with a trailing `/`.
  parentPath: text().references((): AnySQLiteColumn => fileNodes.path),
  name: text().notNull(), // Name of directory.
});

export const fileNodesRelations = relations(fileNodes, ({ one }) => ({
  parent: one(fileNodes, {
    fields: [fileNodes.parentPath],
    references: [fileNodes.path],
  }),
}));

export type Artist = InferSelectModel<typeof artists>;
export type ArtistWithTracks = Prettify<Artist & { tracks: TrackWithAlbum[] }>;

export type Album = InferSelectModel<typeof albums>;
export type AlbumWithTracks = Prettify<Album & { tracks: Track[] }>;

export type Track = InferSelectModel<typeof tracks>;
export type TrackWithAlbum = Prettify<Track & { album: Album | null }>;

export type InvalidTrack = InferSelectModel<typeof invalidTracks>;

export type Playlist = InferSelectModel<typeof playlists>;
export type PlaylistWithJunction = Prettify<
  Playlist & { tracksToPlaylists: Array<{ track: TrackWithAlbum }> }
>;
export type PlaylistWithTracks = Prettify<
  Playlist & { tracks: TrackWithAlbum[] }
>;

export type TrackToPlaylist = InferSelectModel<typeof tracksToPlaylists>;

export type FileNode = InferSelectModel<typeof fileNodes>;
export type FileNodeWithParent = Prettify<
  FileNode & { parent: FileNode | null }
>;
