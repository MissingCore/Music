import { createId } from "@paralleldrive/cuid2";
import type { InferSelectModel, SQL } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

import type { Prettify } from "~/utils/types";
import type { PlayFromSource } from "~/stores/Playback/types";

export const artists = sqliteTable("artists", {
  name: text().primaryKey(),
  artwork: text(),
});

export const artistsRelations = relations(artists, ({ many }) => ({
  albumsToArtists: many(albumsToArtists),
  tracksToArtists: many(tracksToArtists),
}));

export const albums = sqliteTable(
  "albums",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text().notNull(),
    // Used to uniquely identify an album based on the arbitrary number of artists
    // it can have.
    //  - Created by sorting the `artistName` in it's relation and joining with `__`.
    artistsKey: text().notNull(),
    artwork: text().generatedAlwaysAs(
      (): SQL => sql`coalesce(${albums.altArtwork}, ${albums.embeddedArtwork})`,
    ),
    embeddedArtwork: text(),
    altArtwork: text(),
    isFavorite: integer({ mode: "boolean" }).notNull().default(false),
  },
  (t) => [unique().on(t.name, t.artistsKey)],
);

export const albumsRelations = relations(albums, ({ many }) => ({
  albumsToArtists: many(albumsToArtists),
  tracks: many(tracks),
}));

export const albumsToArtists = sqliteTable(
  "albums_to_artists",
  {
    albumId: text()
      .notNull()
      .references(() => albums.id),
    artistName: text()
      .notNull()
      .references(() => artists.name),
  },
  (t) => [primaryKey({ columns: [t.albumId, t.artistName] })],
);

export const albumsToArtistsRelations = relations(
  albumsToArtists,
  ({ one }) => ({
    artist: one(artists, {
      fields: [albumsToArtists.artistName],
      references: [artists.name],
    }),
    track: one(albums, {
      fields: [albumsToArtists.albumId],
      references: [albums.id],
    }),
  }),
);

export const tracks = sqliteTable("tracks", {
  id: text().primaryKey(),
  name: text().notNull(),
  /**
   * Stores the raw "Artist Name" value embedded in the file.
   * @deprecated Access the artist name through the new junction table.
   */
  rawArtistName: text(),
  albumId: text().references(() => albums.id),
  // Album relations
  disc: integer(),
  track: integer(),
  year: integer(),
  // Other metadata
  duration: integer().notNull(), // Track duration in seconds
  format: text(), // Currently the mimetype of the file
  bitrate: integer(),
  sampleRate: integer(),
  size: integer().notNull(),
  uri: text().notNull(),
  modificationTime: integer().notNull(),
  discoverTime: integer().notNull().default(-1),
  // Artwork
  artwork: text().generatedAlwaysAs(
    (): SQL => sql`coalesce(${tracks.altArtwork}, ${tracks.embeddedArtwork})`,
  ),
  embeddedArtwork: text(),
  altArtwork: text(),
  // Data checking fields.
  isFavorite: integer({ mode: "boolean" }).notNull().default(false),
  fetchedArt: integer({ mode: "boolean" }).notNull().default(false),
  // Use Epoch time instead of boolean to track when we did the action.
  editedMetadata: integer(),
  /** @deprecated Use dedicated `hiddenTracks` table. */
  hiddenAt: integer(),
  lastPlayedAt: integer().notNull().default(-1),

  playCount: integer().notNull().default(0),
  parentFolder: text().generatedAlwaysAs(
    // Ref: https://stackoverflow.com/a/38330814
    (): SQL => sql`rtrim(${tracks.uri}, replace(${tracks.uri}, '/', ''))`,
  ),
});

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  album: one(albums, { fields: [tracks.albumId], references: [albums.id] }),
  tracksToArtists: many(tracksToArtists),
  tracksToPlaylists: many(tracksToPlaylists),
  waveformSample: one(waveformSamples),
}));

export const tracksToArtists = sqliteTable(
  "tracks_to_artists",
  {
    trackId: text()
      .notNull()
      .references(() => tracks.id),
    artistName: text()
      .notNull()
      .references(() => artists.name),
  },
  (t) => [primaryKey({ columns: [t.trackId, t.artistName] })],
);

export const tracksToArtistsRelations = relations(
  tracksToArtists,
  ({ one }) => ({
    artist: one(artists, {
      fields: [tracksToArtists.artistName],
      references: [artists.name],
    }),
    track: one(tracks, {
      fields: [tracksToArtists.trackId],
      references: [tracks.id],
    }),
  }),
);

export const hiddenTracks = sqliteTable("hidden_tracks", {
  id: text().primaryKey(),
  uri: text().notNull(),
  name: text().notNull(),
  hiddenAt: integer().notNull(),
});

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

export const playedMediaLists = sqliteTable(
  "played_media_list",
  {
    id: text().notNull(),
    type: text().notNull(),
    lastPlayedAt: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.id, t.type] })],
);

export const waveformSamples = sqliteTable("waveform_sample", {
  trackId: text()
    .notNull()
    .references(() => tracks.id)
    .primaryKey(),
  samples: text({ mode: "json" })
    .notNull()
    .$type<number[]>()
    .default(sql`(json_array())`),
});

export const trackToWaveformSampleRelations = relations(
  waveformSamples,
  ({ one }) => ({
    track: one(tracks, {
      fields: [waveformSamples.trackId],
      references: [tracks.id],
    }),
  }),
);

export type Artist = InferSelectModel<typeof artists>;
export type ArtistWithTracks = Prettify<
  Artist & { tracks: TrackWithRelations[] }
>;

export type Album = InferSelectModel<typeof albums>;
export type AlbumWithTracks = Prettify<Album & { tracks: Track[] }>;

export type Track = Omit<InferSelectModel<typeof tracks>, "rawArtistName"> & {
  /** @deprecated Access the artist name through the new junction table. */
  rawArtistName: string | null;
};
export type TrackWithRelations = Prettify<
  Track & {
    album: Album | null;
    tracksToArtists: Array<{ artistName: string }>;
  }
>;

export type HiddenTrack = InferSelectModel<typeof hiddenTracks>;

export type InvalidTrack = InferSelectModel<typeof invalidTracks>;

export type Playlist = InferSelectModel<typeof playlists>;
export type PlaylistWithJunction = Prettify<
  Playlist & { tracksToPlaylists: Array<{ track: TrackWithRelations }> }
>;
export type PlaylistWithTracks = Prettify<
  Playlist & { tracks: TrackWithRelations[] }
>;

export type TrackToPlaylist = InferSelectModel<typeof tracksToPlaylists>;

export type FileNode = InferSelectModel<typeof fileNodes>;
export type FileNodeWithParent = Prettify<
  FileNode & { parent: FileNode | null }
>;

export type PlayedMediaList = Prettify<
  InferSelectModel<typeof playedMediaLists> & PlayFromSource
>;

export type WaveformSample = InferSelectModel<typeof waveformSamples>;
