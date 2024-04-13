import type { PlaybackKey } from "../types";

/** @description Query keys for "playback" related queries. */
export const playbackKeys = {
  all: [{ entity: "playback" }] as const,
  config: (key: PlaybackKey) => [{ ...playbackKeys.all[0], key }] as const,
};
