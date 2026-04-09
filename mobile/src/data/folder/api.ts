import { and, eq, exists, isNull, like, sql } from "drizzle-orm";

import { db } from "~/db";
import type { FileNode } from "~/db/schema";
import { fileNodes, tracks } from "~/db/schema";

import { viewPreferenceStore } from "~/stores/ViewPreference/store";
import type { SortedTrack } from "../track/types";

import { iAsc, iDesc } from "~/lib/drizzle";
import { addTrailingSlash } from "~/utils/string";
import type { Maybe } from "~/utils/types";
import type { TracksSortOptions } from "../types";
import { commonTracksOrIds } from "../utils";
import { commonTrackColumns, structuredTracksView } from "../views";

//#region GET Methods
/** Get all data associated with a folder. `path` doesn't include `file:///`. */
export async function getFolder(
  path: Maybe<string>,
  sortOptions?: TracksSortOptions<"folder">,
) {
  const [folderDirectories, folderTracks] = await Promise.all([
    getFolderDirectories(path),
    getSortedFolderTracks(path, false, sortOptions),
  ]);

  return { directories: folderDirectories, tracks: folderTracks };
}

/**
 * Return the directories associated with a folder. It's not guaranteed
 * that the folder exists.
 */
export async function getFolderDirectories(path: Maybe<string>) {
  const directories = await db
    .select()
    .from(fileNodes)
    .where(
      and(
        path
          ? eq(fileNodes.parentPath, addTrailingSlash(path))
          : isNull(fileNodes.parentPath),
        exists(
          db
            .select({ id: tracks.id })
            .from(tracks)
            .where(
              like(
                tracks.uri,
                sql<string>`CONCAT('file:///', ${fileNodes.path}, '%')`,
              ),
            )
            .limit(1),
        ),
      ),
    )
    .orderBy(iAsc(fileNodes.name));

  return directories.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      // So folder order is: "1-10", "11-20" instead of: "1-10", "101-110".
      numeric: true,
      caseFirst: "upper",
    }),
  );
}

/**
 * Return the tracks associated with a folder in the specified sort order.
 * It's not guaranteed that the folder exists.
 */
export async function getSortedFolderTracks<
  TOnlyIds extends boolean | undefined = false,
>(
  path: Maybe<string>,
  onlyIds?: TOnlyIds,
  sortOptions?: TracksSortOptions<"folder">,
) {
  if (!path) {
    return [] as unknown as TOnlyIds extends true
      ? Array<{ id: string }>
      : SortedTrack[];
  }

  const { folderIsAsc, folderOrder } = viewPreferenceStore.getState();

  const isAsc = sortOptions?.isAsc ?? folderIsAsc;
  const order = sortOptions?.order ?? folderOrder;

  //? Determine field we'll sort by.
  const sortField =
    order === "artistName"
      ? structuredTracksView.artistsName
      : structuredTracksView[order];

  const results = await db
    .select(
      onlyIds
        ? { id: structuredTracksView.id }
        : {
            ...commonTrackColumns,
            artistName: structuredTracksView.artistsName,
            discoverTime: structuredTracksView.discoverTime,
            modificationTime: structuredTracksView.modificationTime,
          },
    )
    .from(structuredTracksView)
    .where(
      eq(
        structuredTracksView.parentFolder,
        `file:///${addTrailingSlash(path)}`,
      ),
    )
    .orderBy(isAsc ? iAsc(sortField) : iDesc(sortField));

  return commonTracksOrIds<SortedTrack, TOnlyIds>(results, onlyIds);
}
//#endregion

//#region POST
/**
 * Create all the file nodes from an array of uris. Each uri should start
 * with `file:///` and not end with a `/` (the string after the last `/`
 * should be the filename.).
 */
export async function createFolders(uris: string[]) {
  // Removes the `file:///` at the start and the filename at the end of the uri.
  const filePaths = new Set(
    uris.map((uri) => uri.slice(8).split("/").slice(0, -1).join("/")),
  );

  // List of `FileNode` entries that make up the uri.
  const foundNodes: FileNode[] = [];
  const nodeMap: Record<string, Set<string>> = {};
  const rootNodes = new Set<string>();
  filePaths.forEach((filePath) => {
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
        if (!nodeMap[parentPath]?.has(path)) {
          if (nodeMap[parentPath]) nodeMap[parentPath].add(path);
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
//#endregion
