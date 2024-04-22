export type MediaType = "artist" | "album" | "playlist" | "track";

export type MediaListType = Exclude<MediaType, "track">;
