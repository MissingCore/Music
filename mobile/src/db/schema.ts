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

import type { Prettify } from "@/utils/types";

export const artists = sqliteTable("artists", {
  name: text("name").primaryKey(),
});

export const artistsRelations = relations(artists, ({ many }) => ({
  albums: many(albums),
  tracks: many(tracks),
}));

export const albums = sqliteTable(
  "albums",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    // The `artistName` is the album artist.
    artistName: text("artist_name")
      .notNull()
      .references(() => artists.name),
    releaseYear: integer("release_year"),
    artwork: text("artwork"),
    isFavorite: integer("is_favorite", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (t) => ({
    unq: unique().on(t.name, t.artistName, t.releaseYear),
  }),
);

export const albumsRelations = relations(albums, ({ one, many }) => ({
  artist: one(artists, {
    fields: [albums.artistName],
    references: [artists.name],
  }),
  tracks: many(tracks),
}));

export const tracks = sqliteTable("tracks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  artistName: text("artist_name").references(() => artists.name),
  albumId: text("album_id").references(() => albums.id),
  artwork: text("artwork"),
  track: integer("track").notNull().default(-1), // Track number in album if available
  duration: integer("duration").notNull(), // Track duration in seconds
  isFavorite: integer("is_favorite", { mode: "boolean" })
    .notNull()
    .default(false),
  uri: text("uri").notNull(),
  modificationTime: integer("modification_time").notNull(),

  /* Data checking fields. */
  fetchedArt: integer("fetched_art", { mode: "boolean" })
    .notNull()
    .default(false),
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
  id: text("id").primaryKey(),
  uri: text("uri").notNull(),
  errorName: text("error_name"),
  errorMessage: text("error_message"),
  modificationTime: integer("modification_time").notNull(),
});

export const playlists = sqliteTable("playlists", {
  name: text("name").primaryKey(),
  artwork: text("artwork"),
  isFavorite: integer("is_favorite", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const playlistsRelations = relations(playlists, ({ many }) => ({
  tracksToPlaylists: many(tracksToPlaylists),
}));

export const tracksToPlaylists = sqliteTable(
  "tracks_to_playlists",
  {
    trackId: text("track_id")
      .notNull()
      .references(() => tracks.id),
    playlistName: text("playlist_name")
      .notNull()
      .references(() => playlists.name),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.trackId, t.playlistName] }),
  }),
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
  path: text("path").primaryKey(),
  // `null` if `path = "Music"`. Ends with a trailing `/`.
  parentPath: text("parent_path").references(
    (): AnySQLiteColumn => fileNodes.path,
  ),
  name: text("name").notNull(), // Name of directory.
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
