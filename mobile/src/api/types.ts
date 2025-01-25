import type { SQL } from "drizzle-orm";

import type { Track, TrackWithAlbum } from "~/db/schema";

/** Operations passed to `where` clause. */
export type DrizzleFilter = Array<SQL | undefined>;

/**
 * Conditionally select properties of an object type based on optionally
 * provided keys.
 */
export type QueryOneResult<
  TData,
  TCols extends keyof TData | undefined,
> = undefined extends TCols ? TData : Pick<TData, Extract<TCols, keyof TData>>;

/**
 * `QueryOneResult`, but also applies one more layer deep with the `tracks`
 * property.
 */
export type QueryOneWithTracksResult<
  TData extends { tracks: Array<UsedTrackType<WithAlbum>> },
  TDataKeys extends Exclude<keyof TData, "tracks"> | undefined,
  TTrackKeys extends keyof UsedTrackType<WithAlbum> | undefined,
  WithAlbum extends boolean = false,
> = QueryOneResult<TData, TDataKeys> & {
  tracks: Array<QueryOneResult<UsedTrackType<WithAlbum>, TTrackKeys>>;
};

/** When we return an array of `QueryOneResult`. */
export type QueryManyResult<
  TData,
  TCols extends keyof TData | undefined,
> = Array<QueryOneResult<TData, TCols>>;

/** When we return an array of `QueryOneWithTracksResult`. */
export type QueryManyWithTracksResult<
  TData extends { tracks: Array<UsedTrackType<WithAlbum>> },
  TDataKeys extends Exclude<keyof TData, "tracks"> | undefined,
  TTrackKeys extends keyof UsedTrackType<WithAlbum> | undefined,
  WithAlbum extends boolean = false,
> = Array<QueryOneWithTracksResult<TData, TDataKeys, TTrackKeys, WithAlbum>>;

//#region Internal Helpers
/** The variant of `Track` type we used. */
type UsedTrackType<T extends boolean> = true extends T ? TrackWithAlbum : Track;
//#endregion
