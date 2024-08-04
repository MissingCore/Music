import { StorageVolumesDirectoryPaths } from "@missingcore/react-native-metadata-retriever";
import * as FileSystem from "expo-file-system";

import { db } from "@/db";
import type { FileNode } from "@/db/schema";
import { fileNodes } from "@/db/schema";

import { isFulfilled } from "@/utils/promise";
import { addTrailingSlash } from "../utils";

/** Remove the `/` at the start. */
const volumePaths = StorageVolumesDirectoryPaths.map((path) => path.slice(1));

/**
 * Generate the list of `FileNode` entries to a given uri. The uri should
 * start with `file:///`.
 */
export async function savePathComponents(uri: string) {
  // Removes the `file:///` at the start and the filename at the end of the uri.
  const filePath = uri.slice(8).split("/").slice(0, -1).join("/");

  // Check if the file path is in the database already,
  const exists = await db.query.fileNodes.findFirst({
    where: (fields, { eq }) => eq(fields.path, `${filePath}/`),
  });
  if (exists) return;

  // Figure out which storage volume this file belongs to.
  const usedVolume = volumePaths.filter((path) => filePath.startsWith(path))[0];
  // Don't throw error, but exit if the uri doesn't belong to any of the
  // storage volumes detected by `@missingcore/react-native-metadata-retriever`.
  if (!usedVolume) return;

  // List of `FileNode` entries that make up the uri.
  const foundNodes: FileNode[] = [
    { name: usedVolume, path: addTrailingSlash(usedVolume), parentPath: null },
  ];

  // Find remaining `FileNode` entries. `usedVolume.length + 1` is length
  // of `usedVolume` with a trailing slash.
  const segments = filePath.slice(usedVolume.length + 1).split("/");
  segments.forEach((name, idx) => {
    const parentPath = addTrailingSlash(
      `${usedVolume}/${segments.slice(0, idx).join("/")}`,
    );
    foundNodes.push({ name, path: `${parentPath}${name}/`, parentPath });
  });

  // Insert found nodes into database.
  await db.insert(fileNodes).values(foundNodes).onConflictDoNothing();
}

/**
 * Recursively scans library structure (starting from `file:///${dirName}`
 * when `parentPath === undefined`), going all the way down the tree until
 * we no longer find any folders.
 */
export async function scanLibrary({
  dirName,
  parentPath,
}: {
  dirName: string;
  parentPath?: string; // If `undefined`, means we're starting at the root of `Music`.
}) {
  // Create new entry in database. We assume if `parentPath === undefined`,
  // then `dirName` is the path from the "root".
  const currPath = parentPath ? `${parentPath}${dirName}/` : `${dirName}/`;
  await db
    .insert(fileNodes)
    .values({ name: dirName, parentPath, path: currPath })
    .onConflictDoNothing();

  // Look for child directories (filtering out names with file extensions).
  const fullPath = `file:///${currPath}`;
  // We'll assume that if a filename has a period that's not at the beginning,
  // it's before the file extension and thus isn't a directory.
  const childDirNames = (await FileSystem.readDirectoryAsync(fullPath)).filter(
    (fileName) => !fileName.includes("."),
  );
  // Make sure that `childDirNames` only contain directory names.
  const childDirectories = (
    await Promise.allSettled(
      childDirNames.map(async (name) => {
        const uri = `${fullPath}${name}`;
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
