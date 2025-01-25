import type { SQL } from "drizzle-orm";

import type { Album, Track, TrackWithAlbum } from "~/db/schema";

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

/**
 * `QueryOneResult`, but also applies a couple more layers of depth with
 * the `tracks` property and its `album` field.
 */
type QueryOneWithTracksResult_Next<
  TData extends Record<string, any>,
  WithAlbum extends boolean,
  DCols extends keyof TData,
  TCols extends keyof Track,
  ACols extends keyof Album,
> = QueryOneResult<TData, DCols> & {
  tracks: Array<
    QueryOneResult<Track, TCols> &
      (true extends WithAlbum
        ? { album: QueryOneResult<Album, ACols> }
        : Record<never, never>)
  >;
};

/**
 * Function signature for "get single" API functions.
 *
 * **Note:** This requires use of currying to achieve partial type argument
 * inference.
 *  - https://stackoverflow.com/a/60378737
 */
export type QueryOneWithTracksFn<
  TData extends Record<string, any>,
  WithAlbum extends boolean = true,
  TId extends string = string,
> = () => <
  DCols extends keyof TData,
  TCols extends keyof Track,
  ACols extends keyof Album,
>(
  id: TId,
  options?: {
    columns?: DCols[];
    trackColumns?: TCols[];
    albumColumns?: ACols[];
  },
) => Promise<
  QueryOneWithTracksResult_Next<TData, WithAlbum, DCols, TCols, ACols>
>;

/**
 * Function signature for "get many" API functions.
 *
 * **Note:** This requires use of currying to achieve partial type argument
 * inference.
 *  - https://stackoverflow.com/a/60378737
 */
export type QueryManyWithTracksFn<
  TData extends Record<string, any>,
  WithAlbum extends boolean = true,
> = () => <
  DCols extends keyof TData,
  TCols extends keyof Track,
  ACols extends keyof Album,
>(options?: {
  where?: DrizzleFilter;
  columns?: DCols[];
  trackColumns?: TCols[];
  albumColumns?: ACols[];
}) => Promise<
  Array<QueryOneWithTracksResult_Next<TData, WithAlbum, DCols, TCols, ACols>>
>;
