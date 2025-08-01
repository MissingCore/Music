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
