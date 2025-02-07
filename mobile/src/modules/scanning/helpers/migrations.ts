import AsyncStorage from "@react-native-async-storage/async-storage";
import { eq } from "drizzle-orm";

import { db } from "~/db";
import { invalidTracks, tracks, tracksToPlaylists } from "~/db/schema";

import { getPlaylists } from "~/api/playlist";
import { removeInvalidTrackRelations } from "~/api/track";
import { recentListStore } from "~/modules/media/services/RecentList";
import { userPreferencesStore } from "~/services/UserPreferences";

import { fixAlbumFracturization } from "./_album-fracturization";
import type { MigrationOption } from "../constants";
import { MigrationHistory } from "../constants";
import type { PlayListSource } from "../../media/types";

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

  // Get the list of migrations we need to make.
  let pendingMigrations: MigrationOption[] = [];
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
export const MigrationFunctionMap: Record<
  MigrationOption,
  () => Promise<void>
> = {
  "v1-to-v2-store": async () => {
    // Fetch any configs stored in the old AsyncStorage keys.
    const listAllow = await readStorage<string>("directory-allowlist");
    const listBlock = await readStorage<string>("directory-blocklist");
    const recentList = (
      await readStorage<PlayListSource>("recently-played")
    ).map(({ type, id }) => ({ type, id }));

    userPreferencesStore.setState({ listAllow, listBlock });
    recentListStore.setState({ sources: recentList });
  },
  "v1-to-v2-schema": async () => {
    // We now allow the `track` field to be null.
    await db.update(tracks).set({ track: null }).where(eq(tracks.track, -1));
    // Easy way of rechecking all tracks.
    // eslint-disable-next-line drizzle/enforce-update-with-where
    await db.update(tracks).set({ modificationTime: -1 });
    // Convert our default `position = -1` to be sequential based on
    // alphabetical order.
    const allPlaylists = await getPlaylists();
    await db.transaction(async (tx) => {
      const orderedRelations = allPlaylists
        .map(({ name: playlistName, tracks }) =>
          tracks
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((t, position) => ({ playlistName, trackId: t.id, position })),
        )
        .flat();
      // eslint-disable-next-line drizzle/enforce-delete-with-where
      await tx.delete(tracksToPlaylists);
      if (orderedRelations.length > 0) {
        await tx.insert(tracksToPlaylists).values(orderedRelations);
      }
    });
  },
  /** Removes track to playlist relations where the track doesn't exist. */
  "no-track-playlist-ref": removeInvalidTrackRelations,
  "recheck-invalid-tracks": async () => {
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(invalidTracks);
  },
  /** Fix album fracturization caused by `releaseYear = null`. */
  "fix-null-releaseYear": fixAlbumFracturization,
};

/** Helper to parse value from AsyncStorage. */
async function readStorage<TData>(key: string) {
  const _list = await AsyncStorage.getItem(key);
  const list: TData[] = _list !== null ? JSON.parse(_list) : [];
  return Array.isArray(list) ? list : [];
}
