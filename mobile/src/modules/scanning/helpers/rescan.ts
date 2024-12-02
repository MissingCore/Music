import { toast } from "@backpackapp-io/react-native-toast";
import { useMutation } from "@tanstack/react-query";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { fileNodes, invalidTracks, tracks } from "@/db/schema";

import i18next from "@/modules/i18n";
import { getTracks } from "@/api/track";
import { Resynchronize } from "@/modules/media/services/Music";
import { RecentList } from "@/modules/media/services/RecentList";

import { ToastOptions } from "@/lib/toast";
import { batch } from "@/utils/promise";
import { findAndSaveArtwork, cleanupImages } from "../helpers/artwork";
import { cleanupDatabase, findAndSaveAudio } from "./audio";
import { savePathComponents } from "./folder";

/** Look through our library for any new or updated tracks. */
export async function rescanForTracks() {
  const toastId = toast(i18next.t("response.scanStart"), {
    ...ToastOptions,
    duration: Infinity,
  });

  try {
    // Slight buffer before we run our code due to the code blocking the
    // JS thread, causing `isPending` to not update immediately, allowing
    // the user to spam the button to rescan the library.
    await new Promise((resolve) => {
      setTimeout(() => resolve(true), 100);
    });

    // Re-create the "folder" structure for tracks we've already saved.
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(fileNodes);
    const allTracks = await getTracks();
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
      .where(eq(tracks.fetchedArt, true));

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

    toast(i18next.t("response.scanSuccess"), {
      ...ToastOptions,
      id: toastId,
      duration: 4000,
    });
  } catch (err) {
    console.log(err);
    toast.error(i18next.t("response.scanFail"), {
      ...ToastOptions,
      id: toastId,
      duration: 4000,
    });
  }
}

export const useRescanForTracks = () =>
  useMutation({ mutationFn: rescanForTracks });
