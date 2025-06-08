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
    _init: async () => {
      await RecentList.refresh();
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

//#region Helpers
export class RecentList {
  /** Factory function to compare 2 `PlayListSource` inside array methods easier. */
  static #compare(fixedSource: PlayListSource, negate = false) {
    return (source: PlayListSource) => {
      const result = arePlaybackSourceEqual(fixedSource, source);
      return negate ? !result : result;
    };
  }

  /** Add the latest media list played into the recent list. */
  static async add(newSource: PlayListSource) {
    const { sources, recentList } = recentListStore.getState();
    const [inList, atIndex] = this.containsSource(newSource, sources);

    // Get the entry we want to add.
    let newEntry = recentList[atIndex]!;
    if (!inList) newEntry = (await getRecentListEntry(newSource)).data!;
    // Get the values that we'll append our new values in front of.
    const oldSources = inList ? sources.toSpliced(atIndex, 1) : sources;
    const oldEntries = inList ? recentList.toSpliced(atIndex, 1) : recentList;

    recentListStore.setState({
      sources: [newSource, ...oldSources].slice(0, 15),
      recentList: [newEntry, ...oldEntries].slice(0, 15),
    });
  }

  /** Determines if a `PlayListSource` already exists in a `PlayListSource[]`. */
  static containsSource(source: PlayListSource, sourceList?: PlayListSource[]) {
    const sources = sourceList
      ? sourceList
      : recentListStore.getState().sources;
    const atIndex = sources.findIndex(this.#compare(source));
    return [atIndex !== -1, atIndex] as const;
  }

  /**
   * Replace a specific entry in the recent list.
   *
   * **Note:** Only used when renaming a playlist.
   */
  static replaceEntry({
    oldSource,
    newSource,
  }: Record<"oldSource" | "newSource", PlayListSource>) {
    const { sources, recentList } = recentListStore.getState();
    const [inList, atIndex] = this.containsSource(oldSource, sources);

    if (!inList) return;
    recentListStore.setState({
      sources: sources.with(atIndex, newSource),
      recentList: recentList.with(atIndex, {
        ...recentList[atIndex]!,
        title: newSource.id,
        href: `/playlist/${encodeURIComponent(newSource.id)}`,
      }),
    });
  }

  /** Remove multiple entries in the recent list. */
  static removeEntries(removedSources: PlayListSource[]) {
    const { sources, recentList } = recentListStore.getState();

    const removedIndices: number[] = [];
    removedSources.forEach((removedSource) => {
      const [inList, atIndex] = this.containsSource(removedSource, sources);
      if (inList) removedIndices.push(atIndex);
    });

    recentListStore.setState({
      sources: sources.filter((_, idx) => !removedIndices.includes(idx)),
      recentList: recentList.filter((_, idx) => !removedIndices.includes(idx)),
    });
  }

  /**
   * Force revalidation of the values in `recentList`. Useful for when content
   * in `recentList` changes (ie: playlist cover/name) or gets deleted.
   */
  static async refresh(ref?: PlayListSource) {
    const { sources, recentList } = recentListStore.getState();

    if (ref) {
      const [inList, atIndex] = this.containsSource(ref, sources);
      if (!inList) return;
      // Only refresh the data of the source.
      const updatedEntry = (await getRecentListEntry(ref)).data!;
      recentListStore.setState({
        recentList: recentList.with(atIndex, updatedEntry),
      });
      return;
    }

    // Recreate the entries.
    const newRecentList: MediaCard.Content[] = [];
    const errors: PlayListSource[] = [];

    for (const source of sources) {
      const entry = await getRecentListEntry(source);
      if (entry.error) errors.push(source);
      else newRecentList.push(entry.data);
    }

    recentListStore.setState({
      // Remove any `PlayListSource` in `sources` that are invalid.
      sources: sources.filter((s1) => !errors.some(this.#compare(s1))),
      recentList: newRecentList,
    });
  }
}
//#endregion

//#region Utils
/** Get a `MediaCard.Content` from a source in the recent list. */
async function getRecentListEntry({ id, type }: PlayListSource) {
  try {
    let entry: MediaCard.Content;
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
    return { data: entry, error: false } as const;
  } catch {
    return { data: undefined, error: true } as const;
  }
}
//#endregion
