import { StorageVolumesDirectoryPaths } from "@missingcore/react-native-metadata-retriever";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { eq } from "drizzle-orm";
import { getDefaultStore } from "jotai";

import { db } from "@/db";
import { fileNodes, invalidTracks, tracks } from "@/db/schema";

import { allowListAsyncAtom } from "@/features/setting/api/library";
import { hasOnboardedAtom } from "@/modals/categories/onboarding";

import { batch } from "@/utils/promise";
import { fixAlbumFracturization } from "./album-fracturization";
import { savePathComponents } from "../library-scan";
import type { AdjustmentOption } from "../../Config";
import { OverrideHistory } from "../../Config";
import { addTrailingSlash } from "../../utils";

/**
 * Force any re-indexing based on any changes that we made in the code
 * that would require it.
 */
export async function dataReadjustments() {
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
}

/** Logic we want to run depending on what adjustments we need to make. */
export const AdjustmentFunctionMap: Record<
  AdjustmentOption,
  () => Promise<void>
> = {
  "album-fracturization": fixAlbumFracturization,
  "artwork-retry": async () => {
    await db
      .update(tracks)
      .set({ fetchedArt: false })
      .where(eq(tracks.fetchedArt, true));
  },
  "directory-lists": async () => {
    await getDefaultStore().set(
      allowListAsyncAtom,
      StorageVolumesDirectoryPaths.map(
        (path) => `${addTrailingSlash(path)}Music`,
      ),
    );
  },
  "intro-modal": async () => {
    await getDefaultStore().set(hasOnboardedAtom, async (prev) =>
      (await prev) ? true : false,
    );
  },
  "invalid-tracks-retry": async () => {
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(invalidTracks);
  },
  "library-scan": async () => {
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(fileNodes);

    // Create "folder" structure for tracks we've already saved.
    const allTracks = await db.query.tracks.findMany({
      columns: { uri: true },
    });
    await batch({
      data: allTracks,
      callback: ({ uri }) => savePathComponents(uri),
    });
  },
};
