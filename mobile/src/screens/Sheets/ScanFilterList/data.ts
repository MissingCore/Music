import { toast } from "@backpackapp-io/react-native-toast";
import {
  PrimaryDirectoryPath,
  StorageVolumesDirectoryPaths,
} from "@missingcore/react-native-metadata-retriever";
import { useMutation } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";

import i18next from "~/modules/i18n";
import { userPreferencesStore } from "~/services/UserPreferences";

import { ToastOptions } from "~/lib/toast";
import { addTrailingSlash } from "~/utils/string";

const SAF = FileSystem.StorageAccessFramework;

/** `StorageVolumesDirectoryPaths` without `PrimaryDirectoryPath`. */
const NonPrimaryDirectoryPaths = StorageVolumesDirectoryPaths.filter(
  (path) => path !== PrimaryDirectoryPath,
);

//#region Helpers
/** Removes a path from the user preferences store. */
export function removePath(props: {
  list: "listAllow" | "listBlock";
  path: string;
}) {
  userPreferencesStore.setState((prev) => ({
    [props.list]: prev[props.list].filter((path) => path !== props.path),
  }));
}

/** Validates if the path can be used as a filter. */
export function validatePath(path: string) {
  if (!path) return false;
  const trimmed = path.trim();
  return trimmed !== "/" && trimmed.startsWith("/") && !trimmed.includes("//");
}
//#endregion

//#region Path Selector
export async function pickPath() {
  const permissions = await SAF.requestDirectoryPermissionsAsync();
  if (!permissions.granted) {
    toast.error(i18next.t("err.msg.actionCancel"), ToastOptions);
    return;
  }

  // The "path" portion of the `content://` uri is encoded, so we can
  // split by `/` and extract the path with the volume uuid.
  const treeUri = decodeURIComponent(
    permissions.directoryUri.split("/").at(-1)!,
  );
  // Format is: `uuid:some/path`
  const [volumeUUID, ..._path] = treeUri.split(":");
  const path = _path.join(":");

  // Find the storage volume for that given uuid.
  let usedVolume = PrimaryDirectoryPath;
  if (volumeUUID !== "primary") {
    const actualVolume = NonPrimaryDirectoryPaths.filter((path) =>
      path.includes(`/${volumeUUID}`),
    );
    // Used the found volume or a "guess".
    if (actualVolume[0]) usedVolume = actualVolume[0];
    else usedVolume = `/storage/${volumeUUID}`;
  }

  return `${addTrailingSlash(usedVolume)}${path}`;
}
//#endregion

//#region Save Path
async function addPathToList(props: {
  list: "listAllow" | "listBlock";
  path: string;
  onSuccess: () => void;
}) {
  const trimmed = props.path.trim();
  // Check to see if directory exists before we add it.
  try {
    const { exists, isDirectory } = await FileSystem.getInfoAsync(
      `file://${trimmed}`,
    );
    if (!exists || !isDirectory) throw Error();
  } catch {
    toast.error(
      i18next.t("template.notFound", { name: trimmed }),
      ToastOptions,
    );
    return;
  }
  userPreferencesStore.setState((prev) => ({
    [props.list]: [...prev[props.list], trimmed],
  }));
  props.onSuccess();
}

export const useAddPathToList = () =>
  useMutation({ mutationFn: addPathToList });
//#endregion
