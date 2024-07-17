import AsyncStorage from "@react-native-async-storage/async-storage";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { invalidTracks, tracks } from "@/db/schema";

import { fixAlbumFracturization } from "./album-fracturization";
import type { AdjustmentOption } from "../../Config";
import { OverrideHistory } from "../../Config";

/**
 * Force any re-indexing based on any changes that we made in the code
 * that would require it.
 */
export async function dataReadjustments() {
  try {
    const value = await AsyncStorage.getItem("last-adjustment");
    const lastAdjustmentCode = value !== null ? Number(value) : -1;

    // Exit early if we don't need to adjust any data.
    const newestAdjustmentCode = Object.keys(OverrideHistory).length - 1;
    if (lastAdjustmentCode === newestAdjustmentCode) return;

    // Get the list of adjustments we need to make.
    let misingAdjustments: AdjustmentOption[] = [];
    for (let i = lastAdjustmentCode; i < newestAdjustmentCode; i++) {
      misingAdjustments.push(...(OverrideHistory[i + 1]?.changes ?? []));
    }

    // Apply adjustments.
    for (const adjustment of misingAdjustments) {
      await AdjustmentFunctionMap[adjustment]();
    }

    // Make sure we don't do this logic all over again.
    await AsyncStorage.setItem("last-adjustment", `${newestAdjustmentCode}`);
  } catch (err) {
    console.log(err);
  }
}

/** Logic we want to run depending on what adjustments we need to make. */
const AdjustmentFunctionMap: Record<AdjustmentOption, () => Promise<void>> = {
  "album-fracturization": fixAlbumFracturization,
  "artwork-retry": async () => {
    // eslint-disable-next-line drizzle/enforce-update-with-where
    await db.update(tracks).set({ fetchedArt: false });
  },
  "invalid-tracks-retry": async () => {
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(invalidTracks);
  },
};
