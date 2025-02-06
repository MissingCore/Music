import { inArray } from "drizzle-orm";
import { createContext, useContext, useEffect, useRef } from "react";
import type { StoreApi } from "zustand";
import { createStore, useStore } from "zustand";

import { tracks } from "~/db/schema";
import type { Artwork, SlimTrack } from "~/db/slimTypes";

import { getTracks } from "~/api/track";
import { musicStore } from "~/modules/media/services/Music";

type PartialTrack = SlimTrack & { album: { artwork: Artwork } | null };

interface UpcomingStore {
  currentTrackList: Array<PartialTrack | undefined>;
  queuedTrackList: Array<PartialTrack | undefined>;
}

const UpcomingStoreContext = createContext<StoreApi<UpcomingStore>>(
  null as never,
);

export function UpcomingStoreProvider(props: { children: React.ReactNode }) {
  const storeRef = useRef<StoreApi<UpcomingStore>>();
  if (!storeRef.current) {
    storeRef.current = createStore<UpcomingStore>()(() => ({
      currentTrackList: [],
      queuedTrackList: [],
    }));
  }

  useEffect(() => {
    const unsubscribeCurrentList = musicStore.subscribe(
      (state) => state.currentList,
      async (currentList) => {
        const listTracks = await getTracksFromIds(currentList);
        storeRef.current?.setState({ currentTrackList: listTracks });
      },
      { fireImmediately: true },
    );
    const unsubscribeQueueList = musicStore.subscribe(
      (state) => state.queueList,
      async (queueList) => {
        const listTracks = await getTracksFromIds(queueList);
        storeRef.current?.setState({ queuedTrackList: listTracks });
      },
      { fireImmediately: true },
    );

    return () => {
      unsubscribeCurrentList();
      unsubscribeQueueList();
    };
  }, []);

  return (
    <UpcomingStoreContext.Provider value={storeRef.current}>
      {props.children}
    </UpcomingStoreContext.Provider>
  );
}

export function useUpcomingStore<T>(selector: (state: UpcomingStore) => T) {
  const store = useContext(UpcomingStoreContext);
  if (!store) {
    throw new Error(
      "useUpcomingStore must be called within a UpcomingStoreProvider.",
    );
  }
  return useStore(store, selector);
}

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
