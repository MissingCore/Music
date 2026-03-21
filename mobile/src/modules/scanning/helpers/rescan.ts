import { useMutation } from "@tanstack/react-query";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "~/db";
import { fileNodes, invalidTracks, tracks } from "~/db/schema";

import { createFolders } from "~/data/folder/api";
import { Resynchronize } from "~/stores/Playback/actions";

import { clearAllQueries } from "~/lib/react-query";
import { wait } from "~/utils/promise";
import Toast from "~/components/Toast";
import { findAndSaveArtwork } from "./artwork";
import { findAndSaveAudio } from "./audio";
import { AppCleanUp } from "./cleanup";

/** Look through our library for any new or updated tracks. */
export async function rescanForTracks(deepScan = false) {
  Toast.tSuccess("feat.rescan.extra.start", false);

  try {
    // Slight buffer before we run our code due to the code blocking the
    // JS thread, causing `isPending` to not update immediately, allowing
    // the user to spam the button to rescan the library.
    await wait(1);

    // Re-create the "folder" structure for tracks we've already saved.
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(fileNodes);
    const allTracks = await db.query.tracks.findMany({
      columns: { uri: true },
    });
    await createFolders(allTracks.map(({ uri }) => uri));

    // Make sure we retry invalid tracks.
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(invalidTracks);

    // Make sure we allow the retrying of artwork of tracks with no images.
    await db
      .update(tracks)
      .set({ fetchedArt: false })
      .where(and(eq(tracks.fetchedArt, true), isNull(tracks.artwork)));

    // Update all tracks whose metadata hasn't been manually changed by
    // the user, even if its `modificationTime` hasn't changed.
    // Useful to update tracks to comply with new saving behavior (ie:
    // trimming the album, album artist, artist, and track names to prevent
    // unexpected uniqueness).
    if (deepScan) {
      await db
        .update(tracks)
        .set({ modificationTime: -1 })
        .where(isNull(tracks.editedMetadata));
    }

    // Rescan library for any new tracks and delete any old ones.
    const { foundFiles, unstagedFiles } = await findAndSaveAudio();
    await AppCleanUp.tracks(foundFiles.map(({ id }) => id));
    // Make sure any modified tracks isn't being played.
    await Resynchronize.onModifiedTracks(unstagedFiles.map(({ id }) => id));

    // Find and save any images.
    await findAndSaveArtwork();
    await AppCleanUp.images();

    // Ensure queries are all up-to-date.
    clearAllQueries();

    Toast.tSuccess("feat.rescan.extra.success");
  } catch (err) {
    console.log(err);
    Toast.tError("feat.rescan.extra.fail");
  }
}

export const useRescanForTracks = () =>
  useMutation({ mutationFn: rescanForTracks });
