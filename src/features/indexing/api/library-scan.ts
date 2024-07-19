import * as FileSystem from "expo-file-system";

import { db } from "@/db";
import { fileNode } from "@/db/schema";

import { isFulfilled } from "@/utils/promise";
import { MUSIC_DIRECTORY } from "../Config";

/**
 * Recursively scans library structure in `file:///storage/emulated/0/Music/`,
 * going all the way down the tree until we no longer find any folders.
 */
export async function scanLibrary({
  dirName,
  parentPath,
}: {
  dirName: string;
  parentPath?: string; // If `undefined`, means we're starting at the root of `Music`.
}) {
  // Create new entry in database.
  const currPath = parentPath ? `${parentPath}${dirName}/` : `${dirName}/`;
  await db
    .insert(fileNode)
    .values({ name: dirName, parentPath, path: currPath })
    .onConflictDoNothing();

  // Look for child directories (filtering out names with file extensions).
  // We use `.slice(6)` to remove the `Music/`.
  const fullPath = `${MUSIC_DIRECTORY}${currPath.slice(6)}`;
  // We'll assume that if a file name has a period that's not at the beginning,
  // it's before the file extension and thus isn't a directory.
  const childDirNames = (await FileSystem.readDirectoryAsync(fullPath)).filter(
    (fileName) => !fileName.includes("."),
  );
  // Make sure that `childDirNames` only contain directory names.
  const childDirectories = (
    await Promise.allSettled(
      childDirNames.map(async (dirName) => {
        const uri = `${fullPath}${dirName}`;
        const { isDirectory } = await FileSystem.getInfoAsync(uri);
        return isDirectory ? uri : undefined;
      }),
    )
  )
    .filter(isFulfilled)
    .map(({ value }) => value)
    .filter((uri) => uri !== undefined);

  // Recursively add remaining directories.
  await Promise.allSettled(
    childDirectories.map((uri) => {
      const dirName = uri.split(fullPath)[1]!;
      return scanLibrary({ dirName, parentPath: currPath });
    }),
  );
}
