/**
 * @description Default values of key-value pairs stored in AsyncStorage
 *  for "playback" feature.
 */
export const PlaybackAsyncStorageDefaults = {
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
