import { useStore } from "zustand";

import type { PlaylistWithTracks } from "@/db/schema";
import { formatForMediaCard } from "@/db/utils";

import i18next from "@/modules/i18n";
import { getAlbum } from "@/api/album";
import { getArtist } from "@/api/artist";
import { getPlaylist, getSpecialPlaylist } from "@/api/playlist";

import { createPersistedSubscribedStore } from "@/lib/zustand";
import type { ReservedPlaylistName } from "../constants";
import { ReservedNames } from "../constants";
import { arePlaybackSourceEqual } from "../helpers/data";
import type { MediaCard } from "../components";
import type { PlayListSource } from "../types";

//#region Store
interface RecentListStore {
  /** Determines if the store has been hydrated from AsyncStorage. */
  _hasHydrated: boolean;
  setHasHydrated: (newState: boolean) => void;

  /** List of `PlayListSource` the user has played. */
  sources: PlayListSource[];
  /** List of `MediaCard.Content` that we've recently played. */
  recentList: MediaCard.Content[];
}

export const recentListStore = createPersistedSubscribedStore<RecentListStore>(
  (set) => ({
    _hasHydrated: false as boolean,
    setHasHydrated: (state) => set({ _hasHydrated: state }),

    sources: [] as PlayListSource[],
    recentList: [] as MediaCard.Content[],
  }),
  {
    name: "music::recent-list-store",
    // Only store some fields in AsyncStorage.
    partialize: (state) => ({ sources: state.sources }),
    // Listen to when the store is hydrated.
    onRehydrateStorage: () => {
      console.log("[Recent List Store] Re-hydrating storage.");
      return (state, error) => {
        if (error) console.log("[Recent List Store]", error);
        else {
          console.log("[Recent List Store] Completed with:", state);
          state?.setHasHydrated(true);
        }
      };
    },
  },
);

export const useRecentListStore = <T>(
  selector: (state: RecentListStore) => T,
): T => useStore(recentListStore, selector);
//#endregion

//#region Subscriptions
/** Update `recentList` when `sources` changes. */
recentListStore.subscribe(
  (state) => state.sources,
  async (sources) => {
    const newRecentList: MediaCard.Content[] = [];
    let entry: MediaCard.Content | undefined;
    const errors: PlayListSource[] = [];

    for (const { id, type } of sources) {
      try {
        if (type === "album") {
          const data = await getAlbum(id);
          entry = formatForMediaCard({ type: "album", data, t: i18next.t });
        } else if (type === "artist") {
          const data = await getArtist(id);
          entry = formatForMediaCard({ type: "artist", data, t: i18next.t });
        } else if (type === "folder") {
          // TODO: Eventually support folders in the recent list.
          entry = undefined;
        } else {
          let data: PlaylistWithTracks;
          if (ReservedNames.has(id)) {
            data = await getSpecialPlaylist(id as ReservedPlaylistName);
          } else {
            data = await getPlaylist(id);
          }
          entry = formatForMediaCard({ type: "playlist", data, t: i18next.t });
        }
        if (entry) newRecentList.push(entry);
      } catch {
        errors.push({ id, type });
      }
    }

    // Remove any `PlayListSource` in `sources` that are invalid.
    const revisedSources = sources.filter(
      (s1) => !errors.some((s2) => arePlaybackSourceEqual(s1, s2)),
    );

    recentListStore.setState({
      ...(errors.length > 0 ? { sources: revisedSources } : {}),
      recentList: newRecentList,
    });
  },
);
//#endregion

//#region Helpers
export class RecentList {
  /** Factory function to compare 2 `PlayListSource` inside array methods easier. */
  static #compare(fixedSource: PlayListSource, negate = false) {
    return (source: PlayListSource) => {
      const result = arePlaybackSourceEqual(fixedSource, source);
      return negate ? !result : result;
    };
  }

  /** Remove a `PlayListSource` inside a `PlayListSource[]`. */
  static #removeSourceInList(
    removedSource: PlayListSource,
    sourceList: PlayListSource[],
  ) {
    return sourceList.filter(RecentList.#compare(removedSource, true));
  }

  /** Add the latest media list played into the recent list. */
  static add(newSource: PlayListSource) {
    let oldSources = recentListStore.getState().sources;
    if (RecentList.isInRecentList(newSource, oldSources)) {
      oldSources = RecentList.#removeSourceInList(newSource, oldSources);
    }
    recentListStore.setState({ sources: [newSource, ...oldSources] });
  }

  /** Determines if a `PlayListSource` already exists in a `PlayListSource[]`. */
  static isInRecentList(source: PlayListSource, sourceList: PlayListSource[]) {
    return sourceList.some(RecentList.#compare(source));
  }

  /** Replace a specific entry in the recent list. */
  static replaceEntry({
    oldSource,
    newSource,
  }: Record<"oldSource" | "newSource", PlayListSource>) {
    const oldSources = recentListStore.getState().sources;
    const entryIdx = oldSources.findIndex(RecentList.#compare(oldSource));
    if (entryIdx === -1) return;
    recentListStore.setState({ sources: oldSources.with(entryIdx, newSource) });
  }

  /** Remove multiple entries in the recent list. */
  static removeEntries(removedSources: PlayListSource[]) {
    let oldSources = recentListStore.getState().sources;
    removedSources.forEach((removedSource) => {
      oldSources = RecentList.#removeSourceInList(removedSource, oldSources);
    });
    recentListStore.setState({ sources: oldSources });
  }

  /**
   * Force revalidation of the values in `recentList`. Useful for when content
   * in `recentList` changes (ie: playlist cover/name) or gets deleted.
   */
  static refresh() {
    recentListStore.setState((prev) => ({ sources: [...prev.sources] }));
  }
}
//#endregion