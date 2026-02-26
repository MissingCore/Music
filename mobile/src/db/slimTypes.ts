import type { Album, Artist, Genre } from "~/db/schema";

/** Minimum data typically used from `Album`. */
export type SlimAlbum = Pick<Album, "id" | "name" | "artistsKey" | "artwork">;

/** Minimum data typically used from `Artist`. */
export type SlimArtist = Pick<Artist, "name" | "artwork">;

/** Minimum data typically used from `Genre`. */
export type SlimGenre = Pick<Genre, "name" | "artwork">;
