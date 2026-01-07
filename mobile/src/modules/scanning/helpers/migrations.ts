import { eq, inArray } from "drizzle-orm";
import AsyncStorage from "expo-sqlite/kv-store";

import { db } from "~/db";
import type { HiddenTrack } from "~/db/schema";
import {
  albumsToArtists,
  fileNodes,
  hiddenTracks,
  playedMediaLists,
  tracks,
  tracksToArtists,
  tracksToPlaylists,
  waveformSamples,
} from "~/db/schema";

import { preferenceStore } from "~/stores/Preference/store";
import { onboardingStore } from "../services/Onboarding";

import type { PlayFromSource } from "~/stores/Playback/types";
import type { Tab } from "~/stores/Preference/types";
import { savePathComponents } from "./folder";
import type { MigrationOption } from "../constants";
import { MigrationHistory } from "../constants";

import { chunkArray } from "~/utils/object";

/**
 * Run code to change some values prior to indexing for any changes
 * between updates that would require it.
 */
export async function checkForMigrations() {
  const value = await AsyncStorage.getItem("last-adjustment");
  const lastMigrationCode = value !== null ? Number(value) : -1;

  // Exit early if we don't need to do any migrations.
  const lastestMigrationCode = Object.keys(MigrationHistory).length - 1;
  if (lastMigrationCode === lastestMigrationCode) return;

  // Set the current phase to `preprocess` as we have to run some migrations.
  onboardingStore.setState({ phase: "preprocess" });

  // Get the list of migrations we need to make.
  const pendingMigrations: MigrationOption[] = [];
  for (let i = lastMigrationCode; i < lastestMigrationCode; i++) {
    pendingMigrations.push(...(MigrationHistory[i + 1]?.changes ?? []));
  }

  // Apply migrations.
  for (const migration of pendingMigrations) {
    await MigrationFunctionMap[migration]();
  }

  // Make sure we don't do this logic all over again.
  await AsyncStorage.setItem("last-adjustment", `${lastestMigrationCode}`);
}

/** Logic we want to run depending on what migrations we need to do. */
const MigrationFunctionMap: Record<MigrationOption, () => Promise<void>> = {
  "fileNodes-adjustment": async () => {
    const oldRootNodes = await db.query.fileNodes.findMany({
      where: (fields, { isNull }) => isNull(fields.parentPath),
    });
    // Delete these old "shortcut"s.
    await db.delete(fileNodes).where(
      inArray(
        fileNodes.path,
        oldRootNodes.map((node) => node.path),
      ),
    );
    // The "placeholder" portion won't get saved.
    await savePathComponents(
      oldRootNodes.map((node) => "file:///" + node.path + "placeholder"),
    );
  },

  "discover-time-field": async () => {
    await db
      .update(tracks)
      .set({ discoverTime: tracks.modificationTime })
      .where(eq(tracks.discoverTime, -1));
  },

  "recent-list-db-migration": async () => {
    const storeKey = "music::recent-list-store";
    try {
      const recentListStore = await AsyncStorage.getItem(storeKey);
      if (!recentListStore) return;
      // Structure currently is: `{ state: <Recent List store>, version: 0 }`.
      const formattedData = JSON.parse(recentListStore).state
        .sources as PlayFromSource[];
      const currentTime = Date.now();
      // Have `lastPlayedAt` reflect the current order.
      await db.insert(playedMediaLists).values(
        formattedData.map((list, idx) => {
          return { ...list, lastPlayedAt: currentTime - idx };
        }),
      );
      // Delete data at old key when finished.
      await AsyncStorage.removeItem(storeKey);
    } catch {}
  },

  "hide-home-tab": async () => {
    preferenceStore.setState((prev) => {
      const updatedTabOrder = [...prev.tabsOrder];
      // Don't add "home" if it's already in there.
      if (!prev.tabsOrder.includes("home")) updatedTabOrder.unshift("home");

      const updatedTabsVisibility = Object.fromEntries(
        Object.entries(prev.tabsVisibility).concat([["home", true]]),
      ) as Record<Tab, boolean>;

      return {
        tabsOrder: updatedTabOrder,
        tabsVisibility: updatedTabsVisibility,
      };
    });
  },

  "hidden-tracks": async () => {
    const prevHiddenTracks = await db.query.tracks.findMany({
      columns: { id: true, name: true, uri: true, hiddenAt: true },
      where: (fields, { isNotNull }) => isNotNull(fields.hiddenAt),
    });
    if (prevHiddenTracks.length > 0) {
      const hiddenTrackIds = prevHiddenTracks.map((t) => t.id);
      await db
        .insert(hiddenTracks)
        .values(prevHiddenTracks as HiddenTrack[])
        .onConflictDoNothing();
      // Delete relations from hidden tracks.
      await Promise.allSettled([
        db.delete(tracks).where(inArray(tracks.id, hiddenTrackIds)),
        db
          .delete(tracksToPlaylists)
          .where(inArray(tracksToPlaylists.trackId, hiddenTrackIds)),
        db
          .delete(waveformSamples)
          .where(inArray(waveformSamples.trackId, hiddenTrackIds)),
      ]);
    }
  },

  "multi-artist": async () => {
    //? 1. Create track-artist relations.
    const trackArtistNames = await db.query.tracks.findMany({
      columns: { id: true, rawArtistName: true },
    });

    // `rawArtistName` should already exist in the Artists table, so only
    // the junction table needs to be populated.
    const trackBatches = chunkArray(trackArtistNames, 200);
    for (const tBatch of trackBatches) {
      const entries = tBatch
        .map((relation) => {
          if (!relation || !relation.rawArtistName) return undefined;
          return { trackId: relation.id, artistName: relation.rawArtistName };
        })
        .filter((entry) => entry !== undefined);
      if (entries.length > 0) {
        // Populate junction table with old Artist Name values.
        await db.insert(tracksToArtists).values(entries).onConflictDoNothing();
      }
    }

    //? 2. Create album-artist relations.
    const albumArtistNames = await db.query.albums.findMany({
      columns: { id: true, artistsKey: true },
    });

    // `artistsKey` should already exist in the Artists table, so only
    // the junction table needs to be populated.
    const albumBatches = chunkArray(albumArtistNames, 200);
    for (const aBatch of albumBatches) {
      // Populate junction table with old Artist Name values.
      await db
        .insert(albumsToArtists)
        .values(
          aBatch.map((a) => ({ albumId: a.id, artistName: a.artistsKey })),
        )
        .onConflictDoNothing();
    }
  },
};
