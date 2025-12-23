import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, View } from "react-native";

import { Add } from "~/resources/icons/Add";
import { Close } from "~/resources/icons/Close";
import { CreateNewFolder } from "~/resources/icons/CreateNewFolder";
import { usePreferenceStore } from "~/stores/Preference/store";
import { pickPath, removePath, useAddPathToList, validatePath } from "./utils";

import { Colors } from "~/constants/Styles";
import { mutateGuard } from "~/lib/react-query";
import { Marquee } from "~/components/Containment/Marquee";
import { FlatList } from "~/components/Defaults";
import { Button } from "~/components/Form/Button";
import { IconButton } from "~/components/Form/Button/Icon";
import { TextInput } from "~/components/Form/Input";
import { DetachedSheet } from "~/components/Sheet/Detached";
import { useEnableSheetScroll } from "~/components/Sheet/useEnableSheetScroll";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";
import { ContentPlaceholder } from "../../components/Placeholder";

/** Enables us to specify the paths in the allowlist or blocklist. */
export function ScanFilterListSheet(props: {
  listType: "listAllow" | "listBlock";
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
              onPress={() => removePath({ list: props.listType, path: item })}
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
function FilterForm(props: {
  listType: "listAllow" | "listBlock";
  listEntries: string[];
}) {
  const { t } = useTranslation();
  const onSubmit = useAddPathToList();
  const [newPath, setNewPath] = useState("");

  const isValidPath = useMemo(() => {
    const trimmed = newPath.trim();
    return validatePath(newPath) && !props.listEntries.includes(trimmed);
  }, [props.listEntries, newPath]);

  const selectDirectory = async () => {
    try {
      const selectedPath = await pickPath();
      if (selectedPath) setNewPath(selectedPath);
    } catch {
      /* Catch weird `expo-file-system` SAF errors. */
    }
  };

  return (
    <View className="flex-row gap-2">
      {/* FIXME: Noticed w/ RN 0.79, but having a border seems to contribute to the height when it shouldn't. */}
      <View className="h-12 shrink grow flex-row items-center gap-2 border-b border-foreground/10">
        <TextInput
          editable={!onSubmit.isPending}
          value={newPath}
          onChangeText={(text) => setNewPath(text)}
          placeholder="/storage/emulated/0"
          className="shrink grow"
        />
        <IconButton
          Icon={CreateNewFolder}
          accessibilityLabel={t("feat.directory.extra.select")}
          onPress={selectDirectory}
          disabled={onSubmit.isPending}
        />
      </View>
      <Button
        accessibilityLabel={t("feat.directory.extra.add")}
        onPress={() => {
          Keyboard.dismiss();
          mutateGuard(onSubmit, {
            list: props.listType,
            path: newPath,
            onSuccess: () => setNewPath(""),
          });
        }}
        disabled={!isValidPath || onSubmit.isPending}
        className="bg-red p-3"
      >
        <Add color={Colors.neutral100} />
      </Button>
    </View>
  );
}
