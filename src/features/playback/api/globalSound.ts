import { Audio } from "expo-av";
import { atom } from "jotai";

/**
 * @description [FOR INTERNAL USE ONLY] Read-only atom containing an
 *  `Audio.Sound` instance. This is what we'll interact with when dealing
 *  with the current playing sound.
 */
export const soundRefAtom = atom(() => new Audio.Sound());
