import { inArray } from "drizzle-orm";
import { createStore, useStore } from "zustand";

import { tracks } from "~/db/schema";
import type { Artwork, SlimTrack } from "~/db/slimTypes";

import { getTracks } from "~/api/track";
import { musicStore } from "~/modules/media/services/Music";

type PartialTrack = SlimTrack & { album: { artwork: Artwork } | null };

interface UpcomingStore {
  currentTrackList: Array<PartialTrack | undefined>;
  queuedTrackList: Array<PartialTrack | undefined>;

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
  queuedTrackList: [],

  shouldRepopulate: true,
  populateCurrentTrackList: async () => {
    if (!get().shouldRepopulate) return;
    const { currentList } = musicStore.getState();
    const listTracks = await getTracksFromIds(currentList);
    set({ shouldRepopulate: false, currentTrackList: listTracks });
  },
}));

export const useUpcomingStore = <T>(selector: (state: UpcomingStore) => T): T =>
  useStore(upcomingStore, selector);

//#region Subscriptions
/**
 * Populate the `queueList` on app launch since it won't impact performance
 * as much due to usually being small.
 */
musicStore.subscribe(
  (state) => state.queueList,
  async (queueList) => {
    const listTracks = await getTracksFromIds(queueList);
    upcomingStore.setState({ queuedTrackList: listTracks });
  },
);

/**
 * Whenever `currentList` changes, `currentTrackList` may no longer
 * contain accurate data.
 */
musicStore.subscribe(
  (state) => state.currentList,
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
  });
  return trackIds.map((tId) => unorderedTracks.find(({ id }) => id === tId));
}
//#endregion
