import { createContext, use, useMemo, useRef } from "react";
import { toast } from "@backpackapp-io/react-native-toast";
import type { StoreApi } from "zustand";
import { createStore, useStore } from "zustand";

import type { SlimTrackWithAlbum } from "~/db/slimTypes";

import i18next from "~/modules/i18n";
import { sanitizePlaylistName } from "~/api/playlist.utils";
import { TrackList, getTrackArtwork } from "~/api/track.utils";

import { ToastOptions } from "~/lib/toast";
import { moveArray } from "~/utils/object";
import { wait } from "~/utils/promise";
import type { SearchCallbacks } from "~/modules/search/types";

type StoreModeOptions =
  | { mode?: "create"; initialName?: never; initialTracks?: never }
  | {
      mode: "edit";
      initialName: string;
      initialTracks: SlimTrackWithAlbum[];
    };

export type InitStoreProps = StoreModeOptions & {
  usedNames: string[];
  onSubmit: (
    playlistName: string,
    tracks: SlimTrackWithAlbum[],
  ) => Promise<void>;
};

type PlaylistStore = InitStoreProps & {
  playlistName: string;
  setPlaylistName: (newName: string) => void;

  tracks: SlimTrackWithAlbum[];
  _setTracks: (tracks: SlimTrackWithAlbum[]) => void;
  moveTrack: (fromIndex: number, toIndex: number) => void;
  removeTrack: (id: string) => void;

  /** If we're firing the `onSubmit` function. */
  isSubmitting: boolean;
  setIsSubmitting: (status: boolean) => void;
  /** If the "unsaved changes" modal is rendered. */
  showConfirmation: boolean;
  setShowConfirmation: (status: boolean) => void;

  /** Callbacks to add searched tracks to the `tracks` state. */
  SearchCallbacks: Pick<SearchCallbacks, "album" | "folder" | "track">;

  /** Validates our inputs before passing those values to `onSubmit`. */
  INTERNAL_onSubmit: () => Promise<void>;
};

const PlaylistStoreContext = createContext<StoreApi<PlaylistStore>>(
  null as never,
);

export function PlaylistStoreProvider({
  children,
  ...initProps
}: InitStoreProps & { children: React.ReactNode }) {
  const storeRef = useRef<StoreApi<PlaylistStore>>(null);
  if (!storeRef.current) {
    storeRef.current = createStore<PlaylistStore>()((set, get) => ({
      ...initProps,

      playlistName: initProps.initialName ?? "",
      setPlaylistName: (newName) => set({ playlistName: newName }),

      tracks: initProps.initialTracks ?? [],
      _setTracks: (tracks) => set({ tracks }),
      moveTrack: (fromIndex, toIndex) => {
        set((prev) => ({
          tracks: moveArray(prev.tracks, { fromIndex, toIndex }),
        }));
      },
      removeTrack: (id) => {
        set((prev) => ({ tracks: prev.tracks.filter((t) => t.id !== id) }));
      },

      isSubmitting: false,
      setIsSubmitting: (status) => set({ isSubmitting: status }),
      showConfirmation: false,
      setShowConfirmation: (status) => set({ showConfirmation: status }),

      SearchCallbacks: {
        album: ({ tracks, ...album }) => {
          set((prev) => ({
            tracks: TrackList.merge(
              prev.tracks,
              (tracks as SlimTrackWithAlbum[]).map((t) => {
                t.album = album;
                t.artwork = getTrackArtwork(t);
                return t;
              }),
            ),
          }));
          toast(
            i18next.t("template.entryAdded", { name: album.name }),
            ToastOptions,
          );
        },
        folder: ({ name, tracks }) => {
          set((prev) => ({ tracks: TrackList.merge(prev.tracks, tracks) }));
          toast(i18next.t("template.entryAdded", { name }), ToastOptions);
        },
        track: (track) => {
          set((prev) => ({
            tracks: prev.tracks
              .filter(({ id }) => track.id !== id)
              .concat(track),
          }));
          toast(
            i18next.t("template.entryAdded", { name: track.name }),
            ToastOptions,
          );
        },
      },

      INTERNAL_onSubmit: async () => {
        try {
          const { playlistName, tracks, onSubmit } = get();
          const sanitizedName = sanitizePlaylistName(playlistName);
          set({ isSubmitting: true });
          // Slight buffer before running heavy async task.
          await wait(1);
          await onSubmit(sanitizedName, tracks);
        } catch {}
        set({ isSubmitting: false });
      },
    }));
  }

  return (
    <PlaylistStoreContext value={storeRef.current}>
      {children}
    </PlaylistStoreContext>
  );
}

export function usePlaylistStore<T>(selector: (state: PlaylistStore) => T) {
  const store = use(PlaylistStoreContext);
  if (!store) {
    throw new Error(
      "usePlaylistStore must be called within a PlaylistStoreProvider.",
    );
  }
  return useStore(store, selector);
}

/** See if the playlist's name is unique. */
export function useIsPlaylistUnique() {
  const usedNames = usePlaylistStore((s) => s.usedNames);
  const initialName = usePlaylistStore((s) => s.initialName);
  const playlistName = usePlaylistStore((s) => s.playlistName);

  return useMemo(() => {
    // Checks to see if playlist name is unique.
    let isUnique = false;
    try {
      const sanitized = sanitizePlaylistName(playlistName);
      isUnique = sanitized === initialName || !usedNames.includes(sanitized);
    } catch {}
    return isUnique;
  }, [usedNames, initialName, playlistName]);
}

/** See if we've changed this playlist's data. */
export function useIsPlaylistUnchanged() {
  const initialName = usePlaylistStore((s) => s.initialName);
  const initialTracks = usePlaylistStore((s) => s.initialTracks);
  const playlistName = usePlaylistStore((s) => s.playlistName);
  const tracks = usePlaylistStore((s) => s.tracks);

  return useMemo(() => {
    // Checks to see if initial playlist name & tracks is unchanged.
    let nameUnchanged = !playlistName;
    if (!!initialName) nameUnchanged = initialName === playlistName.trim();
    let tracksUnchanged = tracks.length === 0;
    if (initialTracks) {
      tracksUnchanged =
        initialTracks.length === tracks.length &&
        initialTracks.every((t, index) => t.id === tracks[index]?.id);
    }

    return nameUnchanged && tracksUnchanged;
  }, [initialName, initialTracks, playlistName, tracks]);
}
