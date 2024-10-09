/**
 * Store representing the onboarding process.
 *
 * This file contains classes containing helpers to manipulate the store.
 */

import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

//#region Zustand Store
//#region OnboardingStore Interface
interface OnboardingStore {
  /**
   * Onboarding phase currently being conducted. Keys used by the
   * `onboardingScreen` translations.
   */
  phase: "preprocess" | "tracks" | "image";

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
//#endregion

//#region Store Creation
export const onboardingStore = createStore<OnboardingStore>()(() => ({
  phase: "preprocess",

  prevSaved: 0,
  staged: 0,
  unstaged: 0,
  saveErrors: 0,

  checked: 0,
  unchecked: 0,
  found: 0,
}));
//#endregion

//#region Custom Hook
export const useOnboardingStore = <T>(
  selector: (state: OnboardingStore) => T,
): T => useStore(onboardingStore, selector);
//#endregion
//#endregion
