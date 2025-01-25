import type { Track, TrackWithAlbum } from "~/db/schema";

/** The variant of `Track` type we used. */
type UsedTrackType<T extends boolean> = true extends T ? TrackWithAlbum : Track;

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

/** Get columns we want to select in the database schema. */
export function getColumns<T extends string>(keys: T[] | undefined) {
  if (keys === undefined) return undefined;
  return Object.fromEntries(keys.map((key) => [key, true]));
}
