import { Audio } from "expo-av";
import { atom } from "jotai";

/**
 * @description [FOR INTERNAL USE ONLY] The `Audio.Sound` instance we use
 *  for playing tracks.
 */
export const soundRefAtom = atom(() => new Audio.Sound());
