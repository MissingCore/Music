import type { SQL } from "drizzle-orm";

import type { Album, Track } from "~/db/schema";

import type { BooleanPriority } from "~/utils/types";

/** Operations passed to `where` clause. */
export type DrizzleFilter = Array<SQL | undefined>;

/**
 * Conditionally select properties of an object type based on optionally
 * provided keys.
 */
type QueryOneResult<
  TData,
  TCols extends keyof TData | undefined,
> = undefined extends TCols ? TData : Pick<TData, Extract<TCols, keyof TData>>;

/** The structure of each track returned in the `tracks` relation. */
export type QueriedTrack<
  WithAlbum extends boolean,
  TCols extends keyof Track,
  ACols extends keyof Album,
> = QueryOneResult<Track, TCols> &
  (true extends WithAlbum
    ? { album: QueryOneResult<Album, ACols> | null }
    : Record<never, never>);

/**
 * `QueryOneResult`, but also applies a couple more layers of depth with
 * the `tracks` property and its `album` field.
 */
type QueryOneWithTracksResult<
  TData extends Record<string, any>,
  WithAlbum extends boolean,
  DCols extends keyof TData,
  TCols extends keyof Track,
  ACols extends keyof Album,
> = QueryOneResult<TData, DCols> & {
  tracks: Array<QueriedTrack<WithAlbum, TCols, ACols>>;
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
  WithAlbum_User extends boolean | undefined,
>(
  id: TId,
  options?: {
    columns?: DCols[];
    trackColumns?: TCols[];
    albumColumns?: [ACols, ...ACols[]];
    withAlbum?: WithAlbum_User;
  },
) => Promise<
  QueryOneWithTracksResult<
    TData,
    BooleanPriority<WithAlbum_User, WithAlbum>,
    DCols,
    TCols,
    ACols
  >
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
  WithAlbum_User extends boolean | undefined,
>(options?: {
  where?: DrizzleFilter;
  columns?: DCols[];
  trackColumns?: TCols[];
  albumColumns?: [ACols, ...ACols[]];
  withAlbum?: WithAlbum_User;
}) => Promise<
  Array<
    QueryOneWithTracksResult<
      TData,
      BooleanPriority<WithAlbum_User, WithAlbum>,
      DCols,
      TCols,
      ACols
    >
  >
>;
