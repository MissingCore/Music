import { getAudioMetadata } from "@missingcore/audio-metadata";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { eq, inArray } from "drizzle-orm";
import { getDefaultStore } from "jotai";

import { db } from "@/db";
import { artists, tracks } from "@/db/schema";
import { createAlbum } from "@/db/queries";
import { resetPlayingInfoAtom } from "@/features/playback/api/track";

import { getAlbumKey } from "./index-audio";
import type { AdjustmentOption } from "../Config";
import { OverrideHistory } from "../Config";

/**
 * @description Force any re-indexing based on any changes that we made in
 *  the code that would require it.
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

/** @description Logic we want to run depending on what adjustments we need to make. */
const AdjustmentFunctionMap: Record<AdjustmentOption, () => Promise<void>> = {
  "album-fracturization": async () => {
    const allAlbums = await db.query.albums.findMany({
      with: { tracks: { columns: { uri: true } } },
    });
    // Find out which album names aren't unqiue.
    const uniqueNameMap: Record<string, number> = {};
    allAlbums.forEach(({ name }) => {
      uniqueNameMap[name] = (uniqueNameMap[name] ?? 0) + 1;
    });
    // Filter out album names that aren't unique.
    const duplicateNames = Object.entries(uniqueNameMap)
      .filter(([_, count]) => count > 1)
      .map(([name]) => name);
    // Check to see if duplicate names have same `albumArtist`.
    for (const albumName of duplicateNames) {
      // This should be a relatively small list.
      const usedAlbums = allAlbums.filter(({ name }) => name === albumName);
      // Help determine which albums need to be fixed/replaced by getting
      // the current "albumKey" value.
      const albumInfoMap: Record<
        string,
        { name: string; albumArtist: string; year: number | null }
      > = {};
      const albumKeys = await Promise.all(
        usedAlbums.map(async ({ tracks }) => {
          const {
            metadata: { album, albumArtist, year },
          } = await getAudioMetadata(tracks[0]!.uri, [
            ...["album", "albumArtist", "artist", "year"],
          ] as const);

          const key = getAlbumKey({ album, albumArtist, year });
          albumInfoMap[key] = {
            name: album!,
            albumArtist: albumArtist!,
            year: year ?? null,
          };
          return key;
        }),
      );
      // Find which albums we need to fix/replace.
      const duplicatedAlbumKeys = [
        ...new Set(
          albumKeys.filter((key, idx) =>
            albumKeys.some((key2, idx2) =>
              idx !== idx2 ? key === key2 : false,
            ),
          ),
        ),
      ];
      // Create new albums for those duplicated albums.
      const newAlbumMap: Record<string, string> = {};
      await Promise.allSettled(
        duplicatedAlbumKeys.map(async (key) => {
          const { name, albumArtist: artist, year } = albumInfoMap[key]!;
          const entry = { name, artistName: artist, releaseYear: year };
          // Make sure `albumArtist` exists.
          await db
            .insert(artists)
            .values({ name: artist })
            .onConflictDoNothing();
          const { id } = await createAlbum(entry);
          newAlbumMap[key] = id;
        }),
      );
      // Get ids of duplicated albums that will be replaced.
      const albumReplaceMap: Record<string, string[]> = {};
      duplicatedAlbumKeys.forEach((key) => {
        albumReplaceMap[key] = albumKeys
          .map((name, idx) => (key === name ? idx : undefined))
          .filter((idx) => idx !== undefined)
          .map((idx) => usedAlbums[idx]!.id);
      });
      // Replace the ids of album names that are "duplicated" with the new id.
      await Promise.allSettled(
        duplicatedAlbumKeys.map((key) =>
          db
            .update(tracks)
            .set({ albumId: newAlbumMap[key]! })
            .where(inArray(tracks.albumId, albumReplaceMap[key]!)),
        ),
      );

      // Reset playing info in case we're playing a deleted album.
      getDefaultStore().set(resetPlayingInfoAtom);
    }
  },
  fetchedArt: async () => {
    await db
      .update(tracks)
      .set({ fetchedArt: false })
      .where(eq(tracks.fetchedArt, true));
  },
};
