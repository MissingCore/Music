import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

interface SeekStore {
  sliderPos: number | null;
  setSliderPos: (newPos: number | null) => void;
}

/** Tracks when we manipulate the seekbar. */
export const seekStore = createStore<SeekStore>()((set) => ({
  sliderPos: null,
  setSliderPos: (newPos) => set({ sliderPos: newPos }),
}));

export const useSeekStore = <T>(selector: (state: SeekStore) => T): T =>
  useStore(seekStore, selector);
