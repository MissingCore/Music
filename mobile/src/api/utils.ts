import type { Track } from "~/db/schema";

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
  TData extends { tracks: Track[] },
  TDataKeys extends Exclude<keyof TData, "tracks"> | undefined,
  TTrackKeys extends keyof Track | undefined,
> = QueryOneResult<TData, TDataKeys> & {
  tracks: Array<QueryOneResult<Track, TTrackKeys>>;
};

/** Get columns we want to select in the database schema. */
export function getColumns<T extends string>(keys: T[] | undefined) {
  if (keys === undefined) return undefined;
  return Object.fromEntries(keys.map((key) => [key, true]));
}
