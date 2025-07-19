import { toast } from "@backpackapp-io/react-native-toast";
import { useMutation } from "@tanstack/react-query";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "~/db";
import { fileNodes, invalidTracks, tracks } from "~/db/schema";

import i18next from "~/modules/i18n";
import { getTracks } from "~/api/track";
import { RecentList } from "~/modules/media/services/RecentList";
import { Resynchronize } from "~/modules/media/services/Resynchronize";

import { clearAllQueries } from "~/lib/react-query";
import { ToastOptions } from "~/lib/toast";
import { batch, wait } from "~/utils/promise";
import { findAndSaveArtwork, cleanupImages } from "./artwork";
import { cleanupDatabase, findAndSaveAudio } from "./audio";
import { savePathComponents } from "./folder";

/** Look through our library for any new or updated tracks. */
export async function rescanForTracks(deepScan = false) {
  const toastId = toast(i18next.t("feat.rescan.extra.start"), {
    ...ToastOptions,
    duration: Infinity,
  });

  try {
    // Slight buffer before we run our code due to the code blocking the
    // JS thread, causing `isPending` to not update immediately, allowing
    // the user to spam the button to rescan the library.
    await wait(1);

    // Re-create the "folder" structure for tracks we've already saved.
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(fileNodes);
    const allTracks = await getTracks({
      columns: ["uri"],
      withAlbum: false,
      withHidden: true,
    });
    await batch({
      data: allTracks,
      callback: ({ uri }) => savePathComponents(uri),
    });

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
    await cleanupDatabase(foundFiles.map(({ id }) => id));
    // Make sure any modified tracks doesn't belong in the current playing list.
    await Resynchronize.onUpdatedList(unstagedFiles.map(({ id }) => id));

    // Find and save any images.
    await findAndSaveArtwork();
    await cleanupImages();

    // Make sure the "recents" list is correct.
    RecentList.refresh();

    // Ensure queries are all up-to-date.
    clearAllQueries();

    toast(i18next.t("feat.rescan.extra.success"), {
      ...ToastOptions,
      id: toastId,
      duration: 4000,
    });
  } catch (err) {
    console.log(err);
    toast.error(i18next.t("feat.rescan.extra.fail"), {
      ...ToastOptions,
      id: toastId,
      duration: 4000,
    });
  }
}

export const useRescanForTracks = () =>
  useMutation({ mutationFn: rescanForTracks });
