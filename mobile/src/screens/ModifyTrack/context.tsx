import { toast } from "@backpackapp-io/react-native-toast";
import { createContext, use, useMemo, useRef } from "react";
import type { StoreApi } from "zustand";
import { createStore, useStore } from "zustand";

import type { TrackWithAlbum } from "~/db/schema";

import i18next from "~/modules/i18n";
import { upsertAlbums } from "~/api/album";
import { createArtists } from "~/api/artist";
import { updateTrack } from "~/api/track";
import { revalidateActiveTrack } from "~/modules/media/helpers/revalidate";
import {
  cleanupImages,
  getArtworkUri,
} from "~/modules/scanning/helpers/artwork";
import { removeUnusedCategories } from "~/modules/scanning/helpers/audio";
import { router } from "~/navigation/utils/router";

import { ToastOptions } from "~/lib/toast";
import { clearAllQueries } from "~/lib/react-query";
import { wait } from "~/utils/promise";

export type TrackMetadataForm = {
  name: string;
  // Nullable Fields:
  artistName: string;
  album: string;
  albumArtist: string; // Ignore if `album = null`.
  year: string; // Ignore if `album = null`.
  disc: string; // Ignore if not a number or less than 1.
  track: string; // Ignore if not a number or less than 1.
};

export type InitStoreProps = {
  initialData: TrackWithAlbum;
};

type TrackMetadataStore = InitStoreProps &
  TrackMetadataForm & {
    setField: <TKey extends keyof TrackMetadataForm>(
      fieldName: TKey,
    ) => (value: string) => void;
    setFields: (data: Partial<TrackMetadataForm>) => void;

    initialFormData: TrackMetadataForm;

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
    const initialFormData = {
      name: initialData.name,
      artistName: initialData.artistName ?? "",
      album: initialData.album?.name ?? "",
      albumArtist: initialData.album?.artistName ?? "",
      year: initialData.year?.toString() ?? "",
      disc: initialData.disc?.toString() ?? "",
      track: initialData.track?.toString() ?? "",
    };

    storeRef.current = createStore<TrackMetadataStore>()((set, get) => ({
      initialData,

      initialFormData,
      ...initialFormData,

      setField: (fieldName) => (value) => set({ [fieldName]: value }),
      setFields: (data) => set({ ...data }),

      isSubmitting: false,
      setIsSubmitting: (status) => set({ isSubmitting: status }),
      showConfirmation: false,
      setShowConfirmation: (status) => set({ showConfirmation: status }),

      onSubmit: async () => {
        set({ isSubmitting: true });
        // Slight buffer before running heavy async task.
        await wait(1);
        try {
          const { id, uri } = get().initialData;
          const { name, artistName, album, albumArtist, year, disc, track } =
            get();
          if (name.trim().length === 0) throw new Error("Track has no name.");

          const updatedTrack = {
            name: name.trim(),
            artistName: asNonEmptyString(artistName),
            track: asNaturalNumber(track),
            disc: asNaturalNumber(disc),
            year: asNaturalNumber(year),
            embeddedArtwork: null as string | null,
            modificationTime: Date.now(),
            editedMetadata: Date.now(),
          };
          const updatedAlbum = {
            name: asNonEmptyString(album),
            artistName: asNonEmptyString(albumArtist),
          };

          // Add new artists to the database.
          await Promise.allSettled(
            [updatedTrack.artistName, updatedAlbum.artistName]
              .filter((name) => name !== null)
              .map((name) => createArtists([{ name }])),
          );

          const { uri: artworkUri } = await getArtworkUri(uri);

          // Add new album to the database.
          let albumId: string | null = null;
          if (updatedAlbum.name && updatedAlbum.artistName) {
            const [newAlbum] = await upsertAlbums([
              {
                name: updatedAlbum.name,
                artistName: updatedAlbum.artistName,
                embeddedArtwork: artworkUri,
              },
            ]);
            if (newAlbum) albumId = newAlbum.id;
          }
          if (!albumId) updatedTrack.embeddedArtwork = artworkUri;

          await updateTrack(id, { ...updatedTrack, albumId });

          // Revalidate `activeTrack` in Music store if needed.
          await revalidateActiveTrack({ type: "track", id });
          await cleanupImages();
          await removeUnusedCategories();
          clearAllQueries();
          router.back();
        } catch {
          toast.error(i18next.t("err.flow.generic.title"), ToastOptions);
        }
        set({ isSubmitting: false });
      },
    }));
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

/** See if we've changed this track's metadata. */
export function useTrackMetadataIsUnchanged() {
  const initialFormData = useTrackMetadataStore((s) => s.initialFormData);
  const name = useTrackMetadataStore((s) => s.name);
  const artistName = useTrackMetadataStore((s) => s.artistName);
  const album = useTrackMetadataStore((s) => s.album);
  const albumArtist = useTrackMetadataStore((s) => s.albumArtist);
  const year = useTrackMetadataStore((s) => s.year);
  const disc = useTrackMetadataStore((s) => s.disc);
  const track = useTrackMetadataStore((s) => s.track);

  return useMemo(() => {
    const isNameUnchanged = initialFormData.name === name.trim();
    const isArtistNameUnchanged =
      initialFormData.artistName === artistName.trim();
    const isAlbumUnchanged = initialFormData.album === album.trim();
    const isAlbumArtistUnchanged =
      initialFormData.albumArtist === albumArtist.trim();
    const isYearUnchanged = initialFormData.year === year.trim();
    const isDiscUnchanged = initialFormData.disc === disc.trim();
    const isTrackUnchanged = initialFormData.track === track.trim();

    return (
      isNameUnchanged &&
      isArtistNameUnchanged &&
      isAlbumUnchanged &&
      isAlbumArtistUnchanged &&
      isYearUnchanged &&
      isDiscUnchanged &&
      isTrackUnchanged
    );
  }, [
    initialFormData,
    name,
    artistName,
    album,
    albumArtist,
    year,
    disc,
    track,
  ]);
}

//#region Internal Helpers
/** Formats string number as a natural number. */
function asNaturalNumber(numStr: string) {
  const num = Number(numStr);
  if (!Number.isInteger(num) || num < 1) return null;
  return num;
}

/** Returns `null` if empty string. */
function asNonEmptyString(str: string) {
  return str.trim() || null;
}
//#endregion
