import { unwrap } from "jotai/utils";

import { createAtomWithStorage } from "@/lib/jotai";

/** @description [FOR INTERNAL USE ONLY] */
export const repeatAsyncAtom = createAtomWithStorage("repeat", false);
/** @description If we should loop after reaching the end of the track list. */
export const repeatAtom = unwrap(repeatAsyncAtom, (prev) => prev ?? false);

/** @description [FOR INTERNAL USE ONLY] */
export const shuffleAsyncAtom = createAtomWithStorage("shuffle", false);
/** @description If the next track should be "random". */
export const shuffleAtom = unwrap(shuffleAsyncAtom, (prev) => prev ?? false);
