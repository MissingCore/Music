import type { TrackWithAlbum } from "~/db/schema";

import type { ObjectValues } from "~/utils/types";
import type { PlayListSource } from "~/modules/media/types";

//#region Repeat Mode
export const RepeatModes = {
  NO_REPEAT: "no-repeat",
  REPEAT: "repeat",
  REPEAT_ONE: "repeat-one",
} as const;

export type RepeatMode = ObjectValues<typeof RepeatModes>;
//#endregion

//#region Store
export interface PlaybackStore {
  /** Determines if the store has been hydrated from AsyncStorage. */
  _hasHydrated: boolean;
  /** Get a more accurate initial state. */
  _init: (state: PlaybackStore) => Promise<void>;
  /** Revert to default store settings (except for `repeat` & `shuffle`). */
  _resetStore: VoidFunction;

  /** Determines if the playback position has been restored. */
  _hasRestoredPosition: boolean;
  /** The track we want to restore the position for. */
  _restoredTrackId: string | undefined;

  isPlaying: boolean;
  lastPosition: number | undefined;

  repeat: RepeatMode;
  shuffle: boolean;

  playingFrom: PlayListSource | undefined;
  playingFromName: string;

  /** A copy of the original list order at the time of playing. */
  orderSnapshot: string[];
  /** A copy of the original list we're playing from which we can modify. */
  queue: string[];

  activeId: string | undefined;
  activeTrack: TrackWithAlbum | undefined;
  /** Index in current queue where `activeId` is located. */
  queuePosition: number;
}

export const PersistedFields: string[] = [
  "lastPosition",
  "repeat",
  "shuffle",
  "playingFrom",
  "playingFromName",
  "orderSnapshot",
  "queue",
  "activeId",
  "queuePosition",
] satisfies Array<keyof PlaybackStore>;
//#endregion
