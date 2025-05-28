import { db } from "~/db";
import type { FileNode } from "~/db/schema";
import { fileNodes } from "~/db/schema";

import { addTrailingSlash } from "~/utils/string";

/**
 * Generate the list of `FileNode` entries to a given uri. The uri should
 * start with `file:///` and not end with a `/` (the string after the last
 * `/` should be the filename.).
 */
export async function savePathComponents(uri: string) {
  // Removes the `file:///` at the start and the filename at the end of the uri.
  const filePath = uri.slice(8).split("/").slice(0, -1).join("/");

  // Check if the file path is in the database already,
  const exists = await db.query.fileNodes.findFirst({
    where: (fields, { eq }) => eq(fields.path, addTrailingSlash(filePath)),
  });
  if (exists) return;

  // List of `FileNode` entries that make up the uri.
  const foundNodes: FileNode[] = [];
  filePath.split("/").forEach((name, idx) => {
    if (idx === 0) {
      foundNodes.push({ name, path: `${name}/`, parentPath: null });
    } else {
      const parentPath = foundNodes[idx - 1]!.path;
      foundNodes.push({ name, path: `${parentPath}${name}/`, parentPath });
    }
  });

  // Insert found nodes into database.
  if (foundNodes.length > 0) {
    await db.insert(fileNodes).values(foundNodes).onConflictDoNothing();
  }
}
