import { useQuery } from "@tanstack/react-query";
import { sum } from "drizzle-orm";
import * as FileSystem from "expo-file-system";

import { db } from "@/db";
import { albums, artists, playlists, tracks } from "@/db/schema";
import { countFrom } from "@/db/utils/formatters";

import { settingKeys } from "./_queryKeys";

export async function getStorageAndStatistics() {
  // `FileSystem.documentDirectory` is `null` for "web".
  if (!FileSystem.documentDirectory) throw new Error("Web not supported");

  const dbDirInfo = await FileSystem.getInfoAsync(
    FileSystem.documentDirectory + "SQLite",
  );
  const imgDirInfo = await FileSystem.getInfoAsync(
    FileSystem.documentDirectory + "images",
  );
  const userDataInfo = await FileSystem.getInfoAsync(
    FileSystem.documentDirectory,
  );

  const cacheData = await FileSystem.getInfoAsync(
    `${FileSystem.cacheDirectory}`,
  );

  const imagesSize = imgDirInfo.exists ? imgDirInfo.size : 0;
  const databaseSize = dbDirInfo.exists ? dbDirInfo.size : 0;
  const userDataSize = userDataInfo.exists ? userDataInfo.size : 0;

  const cacheSize = cacheData.exists ? cacheData.size : 0;

  return {
    userData: {
      images: imagesSize,
      database: databaseSize,
      other: userDataSize - imagesSize - databaseSize,
      cache: cacheSize,
      total: userDataSize + cacheSize,
    },
    statistics: {
      albums: await countFrom(albums),
      artists: await countFrom(artists),
      playlists: await countFrom(playlists),
      tracks: await countFrom(tracks),
      totalDuration:
        Number(
          (await db.select({ total: sum(tracks.duration) }).from(tracks))[0]
            ?.total,
        ) || 0,
    },
  };
}

/** @description Get information on what's stored on the device. */
export const useStorageInfo = () =>
  useQuery({
    queryKey: settingKeys.storage(),
    queryFn: getStorageAndStatistics,
  });
