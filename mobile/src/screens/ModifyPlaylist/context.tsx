import { createContext, use, useRef } from "react";
import { toast } from "@backpackapp-io/react-native-toast";
import type { StoreApi } from "zustand";
import { createStore, useStore } from "zustand";
import { createComputed } from "zustand-computed";

import type { SlimTrackWithAlbum } from "~/db/slimTypes";
import { getTrackCover, mergeTracks, sanitizePlaylistName } from "~/db/utils";

import i18next from "~/modules/i18n";

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
  moveTrack: (fromIndex: number, toIndex: number) => void;
  removeTrack: (id: string) => void;

  isUnique: boolean;
  isUnchanged: boolean;

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

/** "Derived" state subscribed to changes. */
const computed = createComputed(
  ({
    usedNames,
    initialName,
    initialTracks,
    playlistName,
    tracks,
  }: Omit<PlaylistStore, "isUnique" | "isUnchanged">) => {
    // Checks to see if playlist name is unique.
    let isUnique = false;
    try {
      const sanitized = sanitizePlaylistName(playlistName);
      isUnique = sanitized === initialName || !usedNames.includes(sanitized);
    } catch {}

    // Checks to see if initial playlist name & tracks is unchanged.
    let nameUnchanged = !playlistName;
    if (!!initialName) nameUnchanged = initialName === playlistName.trim();
    let tracksUnchanged = tracks.length === 0;
    if (initialTracks) {
      tracksUnchanged =
        initialTracks.length === tracks.length &&
        initialTracks.every((t, index) => t.id === tracks[index]?.id);
    }

    return { isUnique, isUnchanged: nameUnchanged && tracksUnchanged };
  },
);

const PlaylistStoreContext = createContext<StoreApi<PlaylistStore>>(
  null as never,
);

export function PlaylistStoreProvider({
  children,
  ...initProps
}: InitStoreProps & { children: React.ReactNode }) {
  const storeRef = useRef<StoreApi<PlaylistStore>>(null);
  if (!storeRef.current) {
    storeRef.current = createStore<PlaylistStore>()(
      computed((set, get) => ({
        ...initProps,

        playlistName: initProps.initialName ?? "",
        setPlaylistName: (newName) => set({ playlistName: newName }),

        tracks: initProps.initialTracks ?? [],
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
              tracks: mergeTracks(
                prev.tracks,
                (tracks as SlimTrackWithAlbum[]).map((t) => {
                  t.album = album;
                  t.artwork = getTrackCover(t);
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
            set((prev) => ({ tracks: mergeTracks(prev.tracks, tracks) }));
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
      })),
    );
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
