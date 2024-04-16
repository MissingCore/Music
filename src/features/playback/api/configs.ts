import { atom } from "jotai";
import { loadable } from "jotai/utils";

import { createAtomWithStorage } from "@/lib/jotai";

/** @description [FOR INTERNAL USE ONLY] */
const repeatAsyncAtom = createAtomWithStorage("repeat", false);
const repeatLoadableAtom = loadable(repeatAsyncAtom);
/**
 * @description Returns if we should loop after reach the end of the list
 *  of tracks.
 */
export const repeatAtom = atom(
  (get) => get(repeatLoadableAtom),
  (_get, set, arg: boolean) => set(repeatAsyncAtom, arg),
);

/** @description [FOR INTERNAL USE ONLY] */
const shuffleAsyncAtom = createAtomWithStorage("shuffle", false);
const shuffleLoadableAtom = loadable(shuffleAsyncAtom);
/** @description Return if the next track should be "random". */
export const shuffleAtom = atom(
  (get) => get(shuffleLoadableAtom),
  (_get, set, arg: boolean) => set(shuffleAsyncAtom, arg),
);
