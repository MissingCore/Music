/** @description Different types of media that can be played. */
export type Media = "artist" | "album" | "playlist" | "track";

/** @description Media containing a list of playable content. */
export type MediaList = Exclude<Media, "track">;
