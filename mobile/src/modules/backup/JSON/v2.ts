import { z } from "zod/mini";

import { sanitizePlaylistName } from "~/data/playlist/utils";

import { ZSchema } from "~/modules/form/utils";

//#region Schemas
const PlaylistNameSchema = z.pipe(
  z.string(),
  z.transform(sanitizePlaylistName),
);

const AlbumSchema = z.object({
  name: ZSchema.NonEmptyString,
  // We can derive the album artists from this.
  artistsKey: ZSchema.NonEmptyString,
});

const TrackSchema = z.object({
  uri: ZSchema.NonEmptyString,
  // Alternative method of locating the track if the `uri` isn't the same
  // on the new device.
  relativePath: ZSchema.NonEmptyString,
});

const TrackMetadataSchema = z.object({
  ...TrackSchema.shape,
  name: ZSchema.NonEmptyString,
  artists: z.array(ZSchema.NonEmptyString),
  album: z.nullable(AlbumSchema),
  disc: ZSchema.NullableRealNumber,
  track: ZSchema.NullableRealNumber,
  year: ZSchema.NullableRealNumber,
  genres: z.array(ZSchema.NonEmptyString),
});

const LyricSchema = z.object({
  name: ZSchema.NonEmptyString,
  lyrics: ZSchema.NonEmptyString,
  linkedTracks: z.array(TrackSchema),
});

const BackupSchema = z.object({
  trackMetadata: z.array(TrackMetadataSchema),
  lyrics: z.array(LyricSchema),
  // "Favorited Tracks" will be exported as a playlist.
  playlists: z.array(
    z.object({
      name: PlaylistNameSchema,
      tracks: z.array(TrackSchema),
    }),
  ),
  favorites: z.object({
    albums: z.array(AlbumSchema),
    playlists: z.array(PlaylistNameSchema),
  }),
});
//#endregion
