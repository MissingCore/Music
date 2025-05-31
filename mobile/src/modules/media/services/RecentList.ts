import { useStore } from "zustand";

import type { AlbumWithTracks } from "~/db/schema";
import { formatForMediaCard } from "~/db/utils";

import i18next from "~/modules/i18n";
import { getAlbum } from "~/api/album";
import { getArtist } from "~/api/artist";
import { getFolderTracks } from "~/api/folder";
import { getPlaylist, getSpecialPlaylist } from "~/api/playlist";

import { createPersistedSubscribedStore } from "~/lib/zustand";
import type { ReservedPlaylistName } from "../constants";
import { ReservedNames, ReservedPlaylists } from "../constants";
import { arePlaybackSourceEqual } from "../helpers/data";
import type { MediaCard } from "../components/MediaCard";
import type { PlayListSource } from "../types";

//#region Store
interface RecentListStore {
  /** Determines if the store has been hydrated from AsyncStorage. */
  _hasHydrated: boolean;
  /** Initialize state that weren't initialized from subscriptions. */
  _init: (state: RecentListStore) => void;

  /** List of `PlayListSource` the user has played. */
  sources: PlayListSource[];
  /** List of `MediaCard.Content` that we've recently played. */
  recentList: MediaCard.Content[];
}

export const recentListStore = createPersistedSubscribedStore<RecentListStore>(
  (set) => ({
    _hasHydrated: false,
    _init: () => {
      set({ _hasHydrated: true });
    },

    sources: [],
    recentList: [],
  }),
  {
    name: "music::recent-list-store",
    // Only store some fields in AsyncStorage.
    partialize: (state) => ({ sources: state.sources }),
    // Listen to when the store is hydrated.
    onRehydrateStorage: () => {
      return (state, error) => {
        if (error) console.log("[Recent List Store]", error);
        else state?._init(state);
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
          const data = (await getAlbum(id, {
            columns: ["id", "name", "artistName", "artwork"],
            withTracks: false,
          })) as AlbumWithTracks;
          data.tracks = [];
          entry = formatForMediaCard({ type: "album", data, t: i18next.t });
        } else if (type === "artist") {
          const data = await getArtist(id, {
            columns: ["name", "artwork"],
            trackColumns: ["id"],
            withAlbum: false,
          });
          entry = formatForMediaCard({ type: "artist", data, t: i18next.t });
        } else if (type === "folder") {
          const numTracks = (await getFolderTracks(id)).length;
          if (numTracks === 0) throw new Error("Folder is empty.");
          entry = {
            type: "folder",
            source: null,
            href: `/folder?path=${encodeURIComponent(id)}`,
            title: id.split("/").at(-2) ?? id,
            description: i18next.t("plural.track", { count: numTracks }),
          };
        } else {
          let data = null;
          if (ReservedNames.has(id)) {
            const specialList = await getSpecialPlaylist(
              id as ReservedPlaylistName,
              { trackColumns: ["id"], withAlbum: false },
            );
            data = {
              ...specialList,
              tracks: specialList.tracks.map(() => ({
                artwork: null,
                album: null,
              })),
            };
          } else {
            data = await getPlaylist(id, {
              columns: ["name", "artwork"],
              trackColumns: ["artwork"],
              albumColumns: ["artwork"],
            });
          }
          entry = formatForMediaCard({ type: "playlist", data, t: i18next.t });

          // Translate the names of these special playlists.
          if (entry && ReservedNames.has(id)) {
            const tKey = id === ReservedPlaylists.tracks ? "t" : "favoriteT";
            entry.title = i18next.t(`term.${tKey}racks`);
          }
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
    recentListStore.setState({
      sources: [newSource, ...oldSources].slice(0, 15),
    });
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
