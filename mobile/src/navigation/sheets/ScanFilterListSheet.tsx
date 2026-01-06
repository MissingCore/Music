import { toast } from "@backpackapp-io/react-native-toast";
import { getActualPath } from "@missingcore/react-native-actual-path";
import { Directory } from "expo-file-system";
import { useTranslation } from "react-i18next";
import { Keyboard, View } from "react-native";

import i18next from "~/modules/i18n";
import { Add } from "~/resources/icons/Add";
import { Close } from "~/resources/icons/Close";
import { CreateNewFolder } from "~/resources/icons/CreateNewFolder";
import { preferenceStore, usePreferenceStore } from "~/stores/Preference/store";
import { useInputForm } from "~/hooks/useInputForm";

import { Colors } from "~/constants/Styles";
import { pickDirectory } from "~/lib/file-system";
import { ToastOptions } from "~/lib/toast";
import { addTrailingSlash, getSafeUri } from "~/utils/string";
import { FlatList } from "~/components/Defaults";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { TextInput } from "~/components/Form/Input";
import { Marquee } from "~/components/Marquee";
import { DetachedSheet } from "~/components/Sheet/Detached";
import { useEnableSheetScroll } from "~/components/Sheet/useEnableSheetScroll";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";
import { ContentPlaceholder } from "../components/Placeholder";

type FilterList = "listAllow" | "listBlock";

/** Enables us to specify the paths in the allowlist or blocklist. */
export function ScanFilterListSheet(props: {
  listType: FilterList;
  ref: TrueSheetRef;
}) {
  const { t } = useTranslation();
  const listEntries = usePreferenceStore((s) => s[props.listType]);
  const sheetListHandlers = useEnableSheetScroll();

  return (
    <DetachedSheet
      ref={props.ref}
      titleKey={`feat.${props.listType}.title`}
      keyboardAndToast
      snapTop
    >
      {props.listType === "listBlock" ? (
        <TStyledText
          textKey="feat.listBlock.description"
          dim
          className="text-sm"
        />
      ) : null}
      <FilterForm listType={props.listType} listEntries={listEntries} />

      <FlatList
        data={listEntries}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between gap-2">
            <Marquee color="canvasAlt">
              <StyledText>{item}</StyledText>
            </Marquee>
            <IconButton
              Icon={Close}
              accessibilityLabel={t("template.entryRemove", { name: item })}
              onPress={() => removePath(props.listType, item)}
            />
          </View>
        )}
        ListEmptyComponent={
          <ContentPlaceholder errMsgKey="err.msg.noFilters" />
        }
        {...sheetListHandlers}
        contentContainerClassName="gap-2 pb-4"
      />
    </DetachedSheet>
  );
}

/** Form for adding filters to the list. */
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
      toast.error(t("template.notFound", { name: trimmedPath }), ToastOptions);
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
    <View className="flex-row gap-2">
      {/* FIXME: Noticed w/ RN 0.79, but having a border seems to contribute to the height when it shouldn't. */}
      <View className="h-12 shrink grow flex-row items-center gap-2 border-b border-foreground/10">
        <TextInput
          editable={!inputForm.isSubmitting}
          value={inputForm.value}
          onChangeText={inputForm.onChange}
          placeholder="/storage/emulated/0"
          className="shrink grow"
          forSheet
        />
        <IconButton
          Icon={CreateNewFolder}
          accessibilityLabel={t("feat.directory.extra.select")}
          onPress={selectDirectory}
          disabled={inputForm.isSubmitting}
        />
      </View>
      <FilledIconButton
        Icon={Add}
        accessibilityLabel={t("feat.directory.extra.add")}
        onPress={async () => {
          Keyboard.dismiss();
          await inputForm.onSubmit();
        }}
        disabled={!inputForm.canSubmit || inputForm.isSubmitting}
        className="rounded-md bg-red"
        _iconColor={Colors.neutral100}
      />
    </View>
  );
}

//#region Helpers
async function pickPath() {
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
    if (dirItem) {
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

function removePath(filterList: FilterList, removedPath: string) {
  preferenceStore.setState((prev) => ({
    [filterList]: prev[filterList].filter((path) => path !== removedPath),
  }));
}
//#endregion
