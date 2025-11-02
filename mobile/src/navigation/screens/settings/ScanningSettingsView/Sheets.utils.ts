import { toast } from "@backpackapp-io/react-native-toast";
import { getActualPath } from "@missingcore/react-native-actual-path";
import { useMutation } from "@tanstack/react-query";
import { StorageAccessFramework as SAF } from "expo-file-system";
import { Directory } from "expo-file-system/next";

import i18next from "~/modules/i18n";
import { userPreferenceStore } from "~/stores/UserPreference/store";

import { ToastOptions } from "~/lib/toast";
import { addTrailingSlash, getSafeUri } from "~/utils/string";

//#region Helpers
/** Removes a path from the user preferences store. */
export function removePath(props: {
  list: "listAllow" | "listBlock";
  path: string;
}) {
  userPreferenceStore.setState((prev) => ({
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

  let dirUri: string | null = null;
  try {
    // `getActualPath()` doesn't work with the `content://` URIs returned by
    // `SAF.requestDirectoryPermissionsAsync()`, but works when passing a
    // file or directory inside the selected directory.
    const dirContents = await SAF.readDirectoryAsync(permissions.directoryUri);
    const dirItem = dirContents[0];
    if (dirItem) {
      const resolved = await getActualPath(dirItem);
      dirUri = resolved ? resolved.split("/").slice(0, -1).join("/") : null;
    }
  } catch {}

  if (!dirUri) {
    toast.error(i18next.t("err.flow.generic.title"), ToastOptions);
    return;
  }

  return `${dirUri.startsWith("/") ? "" : "/"}${addTrailingSlash(dirUri)}`;
}
//#endregion

//#region Save Path
async function addPathToList(props: {
  list: "listAllow" | "listBlock";
  path: string;
  onSuccess: VoidFunction;
}) {
  const trimmed = props.path.trim();
  // Check to see if directory exists before we add it.
  try {
    const directory = new Directory(getSafeUri(`file://${trimmed}`));
    if (!directory.exists) throw Error();
  } catch {
    toast.error(
      i18next.t("template.notFound", { name: trimmed }),
      ToastOptions,
    );
    return;
  }
  userPreferenceStore.setState((prev) => ({
    [props.list]: [...prev[props.list], trimmed],
  }));
  props.onSuccess();
}

export const useAddPathToList = () =>
  useMutation({ mutationFn: addPathToList });
//#endregion
