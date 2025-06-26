import { createContext, use, useRef } from "react";
import type { StoreApi } from "zustand";
import { createStore, useStore } from "zustand";
import { createComputed } from "zustand-computed";

import type { TrackWithAlbum } from "~/db/schema";

type TrackMetadataForm = {
  name: string;
  // Nullable Fields:
  artistName: string;
  album: string;
  albumArtist: string; // Ignore if `album = null`.
  year: string; // Ignore if `album = null`.
  disc: string; // Ignore if not a number or less than 1.
  track: string; // Ignore if not a number or less than 1.
};

/** "Derived" state subscribed to changes. */
const computed = createComputed(
  ({
    initialData,
    name,
    artistName,
    album,
    albumArtist,
    year,
    disc,
    track,
  }: Omit<TrackMetadataStore, "isUnchanged">) => {
    const isNameUnchanged = initialData.name === name.trim();
    const isArtistNameUnchanged =
      initialData.artistName === (artistName.trim() || null);
    const isAlbumUnchanged = initialData.album === (album.trim() || null);
    const isAlbumArtistUnchanged =
      initialData.album?.artistName === (albumArtist.trim() || null);
    const isYearUnchanged =
      initialData.album?.releaseYear === (Number(year.trim()) || null);
    const isDiscUnchanged = initialData.disc === (Number(disc.trim()) || null);
    const isTrackUnchanged =
      initialData.track === (Number(track.trim()) || null);

    return {
      isUnchanged:
        isNameUnchanged &&
        isArtistNameUnchanged &&
        isAlbumUnchanged &&
        isAlbumArtistUnchanged &&
        isYearUnchanged &&
        isDiscUnchanged &&
        isTrackUnchanged,
    };
  },
);

export type InitStoreProps = {
  initialData: TrackWithAlbum;
};

type TrackMetadataStore = InitStoreProps &
  TrackMetadataForm & {
    setField: <TKey extends keyof TrackMetadataForm>(
      fieldName: TKey,
    ) => (value: string) => void;

    isUnchanged: boolean;

    /** If we're firing the `onSubmit` function. */
    isSubmitting: boolean;
    setIsSubmitting: (status: boolean) => void;
    /** If the "unsaved changes" modal is rendered. */
    showConfirmation: boolean;
    setShowConfirmation: (status: boolean) => void;

    onSubmit: () => Promise<void>;
  };

const TrackMetadataStoreContext = createContext<StoreApi<TrackMetadataStore>>(
  null as never,
);

export function TrackMetadataStoreProvider({
  children,
  initialData,
}: InitStoreProps & { children: React.ReactNode }) {
  const storeRef = useRef<StoreApi<TrackMetadataStore>>(null);
  if (!storeRef.current) {
    storeRef.current = createStore<TrackMetadataStore>()(
      computed((set, get) => ({
        initialData,

        name: initialData.name,
        artistName: initialData.artistName ?? "",
        album: initialData.album?.name ?? "",
        albumArtist: initialData.album?.artistName ?? "",
        year: initialData.album?.releaseYear?.toString() ?? "",
        disc: initialData.disc?.toString() ?? "",
        track: initialData.track?.toString() ?? "",

        setField: (fieldName) => (value) => set({ [fieldName]: value }),

        isSubmitting: false,
        setIsSubmitting: (status) => set({ isSubmitting: status }),
        showConfirmation: false,
        setShowConfirmation: (status) => set({ showConfirmation: status }),

        onSubmit: async () => {
          try {
            /*
              TODO: Need to implement logic
            */
            const { name, artistName, album, albumArtist, year, disc, track } =
              get();
            set({ isSubmitting: true });
            console.log({
              name,
              artistName,
              album,
              albumArtist,
              year,
              disc,
              track,
            });
          } catch {}
          set({ isSubmitting: false });
        },
      })),
    );
  }

  return (
    <TrackMetadataStoreContext value={storeRef.current}>
      {children}
    </TrackMetadataStoreContext>
  );
}

export function useTrackMetadataStore<T>(
  selector: (state: TrackMetadataStore) => T,
) {
  const store = use(TrackMetadataStoreContext);
  if (!store) {
    throw new Error(
      "useTrackMetadataStore must be called within a TrackMetadataStoreProvider.",
    );
  }
  return useStore(store, selector);
}
