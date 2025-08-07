import { db } from "~/db";
import type { FileNode } from "~/db/schema";
import { fileNodes } from "~/db/schema";

/**
 * Generate the list of `FileNode` entries to for each uri. The uri should
 * start with `file:///` and not end with a `/` (the string after the last
 * `/` should be the filename.).
 */
export async function savePathComponents(uris: string[]) {
  // Removes the `file:///` at the start and the filename at the end of the uri.
  const filePaths = new Set(
    uris.map((uri) => uri.slice(8).split("/").slice(0, -1).join("/")),
  );

  // List of `FileNode` entries that make up the uri.
  const foundNodes: FileNode[] = [];
  const nodeMap: Record<string, Set<string>> = {};
  const rootNodes = new Set<string>();
  filePaths.forEach((filePath, _idx) => {
    const filePathParts = filePath.split("/");
    filePathParts.forEach((name, idx) => {
      if (idx === 0) {
        const path = `${name}/`;
        // Prevent over-inserting root-node paths.
        if (!rootNodes.has(path)) {
          rootNodes.add(path);
          foundNodes.push({ name, path, parentPath: null });
        }
      } else {
        const parentPath = `${filePathParts.slice(0, idx).join("/")}/`;
        const path = `${parentPath}${name}/`;
        // Prevent over-inserting paths (to prevent `RangeError: Maximum call
        // stack size exceeded (native stack depth)` with Drizzle ORM).
        const parentPreSaved = Object.hasOwn(nodeMap, parentPath);
        const exists = parentPreSaved ? nodeMap[parentPath]!.has(path) : false;
        if (!exists) {
          if (parentPreSaved) nodeMap[parentPath]!.add(path);
          else nodeMap[parentPath] = new Set([path]);
          foundNodes.push({ name, path, parentPath });
        }
      }
    });
  });

  // Insert found nodes into database.
  if (foundNodes.length > 0) {
    await db.insert(fileNodes).values(foundNodes).onConflictDoNothing();
  }
}
