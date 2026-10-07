// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { getActualPath } from "@missingcore/react-native-actual-path";
import { toast } from "@missingcore/ui/toast";
import { Directory } from "expo-file-system";
import { useTranslation } from "react-i18next";
import { Keyboard, View } from "react-native";

import i18next from "~/modules/i18n";
import { preferenceStore, usePreferenceStore } from "~/stores/Preference/store";

import { pickDirectory } from "~/lib/file-system";
import { addTrailingSlash, getSafeUri } from "~/utils/string";
import { TextInput } from "~/components/Form/Input";
import { IconButton } from "~/components/next/base/button-icon";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { Text, TText } from "~/components/next/base/typography";
import { Marquee } from "~/components/next/blocks/marquee";
import { useInputForm } from "~/modules/form/useInputForm";

type FilterList = "listAllow" | "listBlock";

/** Enables us to specify the paths in the allowlist or blocklist. */
export function ScanFilterListSheet(props: {
  listType: FilterList;
  ref: SheetRef;
}) {
  const { t } = useTranslation();
  const listEntries = usePreferenceStore((s) => s[props.listType]);
  return (
    <Sheet ref={props.ref} snapTop>
      <Sheet.Header label={t(`feat.${props.listType}.title`)}>
        <TText textKey={`feat.${props.listType}.description`} muted size="sm" />
        <FilterForm listType={props.listType} listEntries={listEntries} />
      </Sheet.Header>
      <Sheet.List
        estimatedItemSize={46} // 40px Height + 6px Margin Bottom
        data={listEntries}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between gap-2">
            <Marquee>
              <Text>{item}</Text>
            </Marquee>
            <IconButton
              icon="close"
              accessibilityLabel={t("template.entryRemove", { name: item })}
              onPress={() => removePath(props.listType, item)}
            />
          </View>
        )}
        contentContainerClassName="gap-1.5 pt-4 pr-1"
      />
    </Sheet>
  );
}

//#region Form
function FilterForm(props: { listType: FilterList; listEntries: string[] }) {
  const { t } = useTranslation();
  const inputForm = useInputForm({
    onSubmit: (trimmedPath) => {
      // Check to see if directory exists before we add it.
      const directory = new Directory(getSafeUri(`file://${trimmedPath}`));
      if (!directory.exists) throw Error();
      preferenceStore.setState((prev) => ({
        [props.listType]: [...prev[props.listType], trimmedPath],
      }));
    },
    onError: (trimmedPath) => {
      toast.error(t("template.notFound", { name: trimmedPath }));
    },
    onConstraints: (trimmedPath) => {
      return (
        trimmedPath !== "/" &&
        trimmedPath.startsWith("/") &&
        !trimmedPath.includes("//") &&
        !props.listEntries.includes(trimmedPath)
      );
    },
  });

  const selectDirectory = async () => {
    try {
      const selectedPath = await pickPath();
      if (selectedPath) inputForm.onChange(selectedPath);
    } catch {
      /* Catch weird `expo-file-system` SAF errors. */
    }
  };

  return (
    <View className="flex-row gap-2 pt-4">
      {/* FIXME: Noticed w/ RN 0.79, but having a border seems to contribute to the height when it shouldn't. */}
      <View className="h-12 shrink grow flex-row items-center gap-2 border-b border-outline">
        <TextInput
          editable={!inputForm.isSubmitting}
          value={inputForm.value}
          onChangeText={inputForm.onChange}
          placeholder="/storage/emulated/0"
          className="shrink grow"
          forSheet
        />
        <IconButton
          icon="create-new-folder"
          accessibilityLabel={t("feat.directory.extra.select")}
          onPress={selectDirectory}
          disabled={inputForm.isSubmitting}
          size="md"
        />
      </View>
      <IconButton
        icon="add"
        accessibilityLabel={t("feat.directory.extra.add")}
        onPress={async () => {
          Keyboard.dismiss();
          await inputForm.onSubmit();
        }}
        disabled={!inputForm.canSubmit || inputForm.isSubmitting}
        intent="primary"
        filled
        size="md"
        className="rounded-md"
      />
    </View>
  );
}
//#endregion

//#region Helpers
async function pickPath() {
  let dir; // Let TypeScript handle type inference.
  try {
    dir = await pickDirectory();
  } catch {
    toast.tError("err.msg.actionCancel");
    return;
  }

  let dirUri: string | null = null;
  try {
    // `getActualPath()` doesn't work with the `content://` URIs returned by
    // `SAF.requestDirectoryPermissionsAsync()`, but works when passing a
    // file or directory inside the selected directory.
    const dirContents = dir.listAsRecords();
    const dirItem = dirContents[0];
    if (dirItem) {
      const resolved = await getActualPath(dirItem.uri);
      dirUri = resolved ? resolved.split("/").slice(0, -1).join("/") : null;
    }
  } catch {}

  if (!dirUri) {
    toast.tError("err.flow.generic.title");
    return;
  }

  return `${dirUri.startsWith("/") ? "" : "/"}${addTrailingSlash(dirUri)}`;
}

function removePath(filterList: FilterList, removedPath: string) {
  preferenceStore.setState((prev) => ({
    [filterList]: prev[filterList].filter((path) => path !== removedPath),
  }));
  toast(i18next.t("template.entryRemoved", { name: removedPath }));
}
//#endregion
