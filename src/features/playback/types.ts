import type { MediaType } from "@/components/media/types";

/** @description Where we'll get the list of tracks we'll play from. */
type PlaybackSource = {
  type: Omit<MediaType, "track">;
  /** "id" of the list in the given `type`. */
  ref: string;
};

/**
 * @description Default values of key-value pairs stored in AsyncStorage
 *  for "playback" feature.
 */
export const PlaybackAsyncStorageDefaults = {
  source: undefined as PlaybackSource | undefined,

  /* Playback Options */
  repeat: false,
  shuffle: false,
};

/** @description The keys available in the AsyncStorage. */
export type PlaybackKey = keyof typeof PlaybackAsyncStorageDefaults;

/** @description The result we expect from a given `PlaybackKey`. */
export type PlaybackValue<TKey extends PlaybackKey> =
  (typeof PlaybackAsyncStorageDefaults)[TKey];

/** @description Keys of values which we can toggle (ie: value is `boolean`). */
export type ToggleableControls = "repeat" | "shuffle";
