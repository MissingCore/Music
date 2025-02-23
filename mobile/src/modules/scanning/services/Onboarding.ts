import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

interface OnboardingStore {
  /**
   * Onboarding phase currently being conducted. Keys used by the
   * `onboardingScreen` translations.
   */
  phase: "preprocess" | "tracks" | "image" | undefined;

  /** Number of tracks previously saved. */
  prevSaved: number;
  /** Number of new/modified tracks saved. */
  staged: number;
  /** Number of new/modified tracks. */
  unstaged: number;
  /** Number of errors that occurred during the track saving process. */
  saveErrors: number;

  /** Number of tracks checked for images. */
  checked: number;
  /** Number of tracks not checked for images. */
  unchecked: number;
  /** Number of new images found. */
  found: number;
}

/**
 * Tracks where we are in the onboarding process - from running migrations,
 * saving/updating tracks, or saving images.
 */
export const onboardingStore = createStore<OnboardingStore>()(() => ({
  phase: undefined,

  prevSaved: 0,
  staged: 0,
  unstaged: 0,
  saveErrors: 0,

  checked: 0,
  unchecked: 0,
  found: 0,
}));

export const useOnboardingStore = <T>(
  selector: (state: OnboardingStore) => T,
): T => useStore(onboardingStore, selector);
