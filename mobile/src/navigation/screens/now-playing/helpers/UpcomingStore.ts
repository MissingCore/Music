import { inArray } from "drizzle-orm";
import { createStore, useStore } from "zustand";

import { tracks } from "~/db/schema";
import type { SlimTrack, TrackArtwork } from "~/db/slimTypes";

import { getTracks } from "~/api/track";
import { playbackStore } from "~/stores/Playback/store";

type PartialTrack = SlimTrack & Required<TrackArtwork>;

export interface UpcomingStore {
  currentTrackList: Array<PartialTrack | undefined>;

  /**
   * Indicates that we need to update the data in `currentTrackList` when
   * we reopen the "Upcoming Tracks" sheet.
   */
  shouldRepopulate: boolean;
  /**
   * Called when we open the "Upcoming Tracks" sheet to populate
   * `currentTrackList` when needed. This prevents unnecessary UI hanging
   * when we don't open the sheet in the app session.
   */
  populateCurrentTrackList: () => Promise<void>;
}

const upcomingStore = createStore<UpcomingStore>()((set, get) => ({
  currentTrackList: [],

  shouldRepopulate: true,
  populateCurrentTrackList: async () => {
    if (!get().shouldRepopulate) return;
    const { queue } = playbackStore.getState();
    const listTracks = await getTracksFromIds(queue);
    set({ shouldRepopulate: false, currentTrackList: listTracks });
  },
}));

export const useUpcomingStore = <T>(selector: (state: UpcomingStore) => T): T =>
  useStore(upcomingStore, selector);

//#region Subscriptions
/**
 * Whenever `currentList` changes, `currentTrackList` may no longer
 * contain accurate data.
 *
 * @deprecated Temporary for removal of Music store.
 */
playbackStore.subscribe(
  (state) => state.queue,
  () => {
    upcomingStore.setState({ shouldRepopulate: true, currentTrackList: [] });
  },
);
//#endregion

//#region Internal Helpers
/** Get list of tracks from track ids. */
async function getTracksFromIds(trackIds: string[]) {
  if (trackIds.length === 0) return [];
  const unorderedTracks = await getTracks({
    where: [inArray(tracks.id, trackIds)],
    columns: ["id", "name", "artistName", "artwork"],
    albumColumns: ["artwork"],
    withHidden: true,
  });
  return trackIds.map((tId) => unorderedTracks.find(({ id }) => id === tId));
}
//#endregion
