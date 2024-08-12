import { Audio } from "expo-av";
import { atom } from "jotai";

/** [🇫🇴🇷 🇮🇳🇹🇪🇷🇳🇦🇱 🇺🇸🇪 🇴🇳🇱🇾] `Audio.Sound` instance used. */
export const soundRefAtom = atom(() => new Audio.Sound());
