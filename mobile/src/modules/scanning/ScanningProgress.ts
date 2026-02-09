import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

interface ScanningProgressStore {
  scannedTracks: number;
  modifiedTracks: number;
  failedTrackScans: number;

  checkedArtwork: number;
  uncheckedArtwork: number;
}

export const scanningProgressStore = createStore<ScanningProgressStore>()(
  () => ({
    scannedTracks: 0,
    modifiedTracks: 0,
    failedTrackScans: 0,

    checkedArtwork: 0,
    uncheckedArtwork: 0,
  }),
);

export const useScanningProgressStore = <T>(
  selector: (state: ScanningProgressStore) => T,
): T => useStore(scanningProgressStore, selector);
