import { toast } from "@backpackapp-io/react-native-toast";
import { getActualPath } from "@missingcore/react-native-actual-path";
import { useMutation } from "@tanstack/react-query";
import { Directory } from "expo-file-system";

import i18next from "~/modules/i18n";
import { preferenceStore } from "~/stores/Preference/store";

import { ToastOptions } from "~/lib/toast";
import { addTrailingSlash, getSafeUri } from "~/utils/string";
import { pickDirectory } from "~/lib/file-system";

//#region Helpers
/** Removes a path from the preference store. */
export function removePath(props: {
  list: "listAllow" | "listBlock";
  path: string;
}) {
  preferenceStore.setState((prev) => ({
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
  let dir; // Let TypeScript handle type inference.
  try {
    dir = await pickDirectory();
  } catch {
    toast.error(i18next.t("err.msg.actionCancel"), ToastOptions);
    return;
  }

  let dirUri: string | null = null;
  try {
    // `getActualPath()` doesn't work with the `content://` URIs returned by
    // `SAF.requestDirectoryPermissionsAsync()`, but works when passing a
    // file or directory inside the selected directory.
    const dirContents = dir.listAsRecords();
    const dirItem = dirContents[0];
    if (dirItem !== undefined && !dirItem.isDirectory) {
      const resolved = await getActualPath(dirItem.uri);
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
  preferenceStore.setState((prev) => ({
    [props.list]: [...prev[props.list], trimmed],
  }));
  props.onSuccess();
}

export const useAddPathToList = () =>
  useMutation({ mutationFn: addPathToList });
//#endregion
