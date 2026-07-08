// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { eq, inArray } from "drizzle-orm";
import { Image } from "expo-image";
import AsyncStorage from "expo-sqlite/kv-store";

import { db } from "~/db";
import type { HiddenTrack } from "~/db/schema";
import {
  albumsToArtists,
  fileNodes,
  hiddenTracks,
  playedMediaLists,
  playlists,
  tracks,
  tracksToArtists,
  tracksToPlaylists,
  waveformSamples,
} from "~/db/schema";

import { createFolders } from "~/data/folder/api";
import { updatePlaylist } from "~/data/playlist/api";
import { playbackStore } from "~/stores/Playback/store";
import { preferenceStore } from "~/stores/Preference/store";

import type { PlayFromSource } from "~/stores/Playback/types";
import type { Tab } from "~/stores/Preference/types";
import type { MigrationOption } from "../constants";
import { MigrationHistory } from "../constants";

import { iAsc } from "~/lib/drizzle";
import { chunkArray } from "~/utils/object";
import { FavoritesPlaylistKey } from "~/modules/media/constants";

/**
 * Run code to change some values prior to indexing for any changes
 * between updates that would require it.
 */
export async function checkForMigrations() {
  const value = await AsyncStorage.getItem("last-adjustment");
  const lastMigrationCode = value !== null ? Number(value) : -1;

  //? Ensure the "Favorite Tracks" playlist exist.
  await db
    .insert(playlists)
    .values({ name: FavoritesPlaylistKey, isFavorite: true })
    .onConflictDoUpdate({
      target: [playlists.name],
      // Keep the "Favorite Tracks" playlist as favorited.
      set: { isFavorite: true },
    });

  // Exit early if we don't need to do any migrations.
  const lastestMigrationCode = Object.keys(MigrationHistory).length - 1;
  if (lastMigrationCode === lastestMigrationCode) return;

  // Get the list of migrations we need to make.
  const pendingMigrations: MigrationOption[] = [];
  for (let i = lastMigrationCode; i < lastestMigrationCode; i++) {
    pendingMigrations.push(...(MigrationHistory[i + 1]?.changes ?? []));
  }

  // Apply migrations.
  for (const migration of pendingMigrations) {
    await MigrationFunctionMap[migration](lastMigrationCode);
  }

  // Make sure we don't do this logic all over again.
  await AsyncStorage.setItem("last-adjustment", `${lastestMigrationCode}`);
}

/** Logic we want to run depending on what migrations we need to do. */
const MigrationFunctionMap: Record<
  MigrationOption,
  (lastMigrationCode: number) => Promise<void>
> = {
  //? v2.3.0
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
    await createFolders(
      oldRootNodes.map((node) => "file:///" + node.path + "placeholder"),
    );
  },

  //? v2.4.0
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

  //? v2.6.0
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

  //? v3.0.0-rc.0
  "onboarding-flow": async (lastMigrationCode) => {
    //? Ensure we skip the onboarding screen if `lastMigrationCode !== -1`.
    if (lastMigrationCode !== -1) {
      preferenceStore.setState((prev) => {
        const updatedTabOrder = [...prev.tabsOrder];
        // Don't add "genre" if it's already in there.
        if (!prev.tabsOrder.includes("genre")) updatedTabOrder.push("genre");

        const updatedTabsVisibility = Object.fromEntries(
          Object.entries(prev.tabsVisibility).concat([["genre", true]]),
        ) as Record<Tab, boolean>;

        return {
          completedOnboarding: true,
          //? Enable `checkForUpdates` for existing users as it's off by default
          //? for new users due to now having a proper onboarding screen.
          checkForUpdates: true,

          //? Add "Genre" tab.
          tabsOrder: updatedTabOrder,
          tabsVisibility: updatedTabsVisibility,
        };
      });
    }
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
  favorites: async () => {
    //? 1. Fix `playingFrom` if we last played from the "Favorite Tracks" list.
    const { playingFrom } = playbackStore.getState();
    if (playingFrom?.id === "Favorite Tracks") {
      playbackStore.setState({
        playingFrom: { type: "playlist", id: FavoritesPlaylistKey },
      });
    }

    //? 2. Migrate tracks over.
    const favTracks = await db.query.tracks.findMany({
      columns: { id: true },
      where: (fields, { eq }) => eq(fields.isFavorite, true),
      orderBy: (fields) => iAsc(fields.name),
    });

    try {
      if (favTracks.length === 0) return;
      await updatePlaylist(FavoritesPlaylistKey, { tracks: favTracks });
    } catch (err) {
      console.log("[Failed to migrate favorite tracks]", err);
    }
  },

  //? v3.4.0-rc.0
  "clear-image-cache": async () => {
    await Image.clearDiskCache();
  },
};
