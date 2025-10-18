/** Types of "media" we can play audio from. */
export type MediaType = "album" | "artist" | "folder" | "playlist" | "track";

/** Identifies a list of tracks that will be played. */
export type PlayFromSource = { type: Exclude<MediaType, "track">; id: string };
