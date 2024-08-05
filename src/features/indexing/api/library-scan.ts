import { StorageVolumesDirectoryPaths } from "@missingcore/react-native-metadata-retriever";

import { db } from "@/db";
import type { FileNode } from "@/db/schema";
import { fileNodes } from "@/db/schema";

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
    { name: usedVolume, path: `${usedVolume}/`, parentPath: null },
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
