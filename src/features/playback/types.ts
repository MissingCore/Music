export type TPlaybackAsyncStorage = {
  currentTrack: string | undefined;

  repeat: boolean;
  shuffle: boolean;
};

/**
 * @description Default values of key-value pairs stored in AsyncStorage
 *  for "playback" feature.
 */
export const PlaybackAsyncStorageDefaults: TPlaybackAsyncStorage = {
  /** Id of the track currently being played. */
  currentTrack: undefined,

  /* Playback Options */
  repeat: false,
  shuffle: false,
};

/** @description The keys available in the AsyncStorage. */
export type PlaybackKey = keyof TPlaybackAsyncStorage;

/** @description The result we expect from a given `PlaybackKey`. */
export type PlaybackValue<TKey extends PlaybackKey> =
  TPlaybackAsyncStorage[TKey];

/** @description Keys of values which we can toggle (ie: value is `boolean`). */
export type ToggleableControls = "repeat" | "shuffle";
