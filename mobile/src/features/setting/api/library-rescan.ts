import { useMutation } from "@tanstack/react-query";
import { Toast } from "react-native-toast-notifications";

import { cleanUpArtwork } from "@/features/indexing/api/artwork-cleanup";
import { saveArtwork } from "@/features/indexing/api/artwork-save";
import { cleanUpDb } from "@/features/indexing/api/db-cleanup";
import { doAudioIndexing } from "@/features/indexing/api/index-audio";
import { AdjustmentFunctionMap } from "@/features/indexing/api/index-override";
import { RecentList } from "@/modules/media/services/next/Music";

export async function rescanLibrary() {
  const toastId = Toast.show("Rescanning library...", { duration: 0 });

  try {
    // Slight buffer before we run our code due to the code blocking the
    // JS thread, causing `isPending` to not update immediately, allowing
    // the user to spam the button to rescan the library.
    await new Promise((resolve) => {
      setTimeout(() => resolve(true), 100);
    });

    // Re-create the "folder" structure for tracks we've already saved.
    await AdjustmentFunctionMap["library-scan"]();
    // Make sure we retry invalid tracks.
    await AdjustmentFunctionMap["invalid-tracks-retry"]();
    // Make sure we allow the retrying of artwork of tracks with no images.
    await AdjustmentFunctionMap["artwork-retry"]();
    // Rescan library for any new tracks and delete any old ones.
    const { foundFiles } = await doAudioIndexing();
    await cleanUpDb(new Set(foundFiles.map(({ id }) => id)));
    // Get the artwork for any new tracks.
    await saveArtwork();
    await cleanUpArtwork();

    // Make sure the "recents" list is correct.
    await RecentList.refresh();

    Toast.update(toastId, "Finished rescanning library.", { duration: 3000 });
  } catch (err) {
    console.log(err);
    Toast.update(toastId, "Failed to rescan library.", {
      type: "danger",
      duration: 3000,
    });
  }
}

/**
 * Re-create the list of file nodes used for the "Folders" feature. In addition,
 * looks for any new tracks.
 */
export const useRescanLibrary = () =>
  useMutation({ mutationFn: rescanLibrary });
