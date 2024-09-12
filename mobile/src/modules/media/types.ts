/** Types of "media" we can play audio from. */
export type MediaType = "album" | "artist" | "folder" | "playlist" | "track";

// FIXME: We currently also ignore "folder" to preserve the old behavior.
/** Media containing a list of playable content. */
export type MediaList = Exclude<MediaType, "folder" | "track">;

/** Identifies a list of tracks that will be played. */
export type PlayListSource = { type: MediaType; id: string };
