import {
  PrimaryDirectoryPath,
  StorageVolumesDirectoryPaths,
} from "@missingcore/react-native-metadata-retriever";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, View } from "react-native";
import type { SheetProps } from "react-native-actions-sheet";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";

import { Add, CreateNewFolder, Remove } from "@/icons";
import { useUserPreferencesStore } from "@/services/UserPreferences";
import { useTheme } from "@/hooks/useTheme";
import { pickPath, removePath, useAddPathToList, validatePath } from "./data";

import { Colors } from "@/constants/Styles";
import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import { Marquee, cardStyles } from "@/components/Containment";
import { IconButton, TextInput } from "@/components/Form";
import { Sheet } from "@/components/Sheet";
import { Swipeable } from "@/components/Swipeable";
import { StyledText } from "@/components/Typography";

//#region Sheet
/** Sheet used to edit the paths in the allowlist or blocklist. */
export default function ScanFilterListSheet(
  props: SheetProps<"scan-filter-list-sheet">,
) {
  const listType = props.payload!.listType;

  const { t } = useTranslation();
  const { surface } = useTheme();
  const listEntries = useUserPreferencesStore((state) => state[listType]);

  return (
    <Sheet
      id={props.sheetId}
      title={t(`title.${listType}`)}
      contentContainerClassName="gap-4 px-0"
      snapTop
    >
      <StyledText preset="dimOnCanvas" center className="px-4 text-sm">
        {t(`settings.description.${listType}`)}
        {listType === "listAllow" ? (
          <StyledText preset="dimOnSurface" className="text-xs">
            {"\n"}
            {StorageVolumesDirectoryPaths.map((dir) => `\n${dir}`)}
          </StyledText>
        ) : null}
      </StyledText>
      <FilterForm {...{ listType, listEntries }} />

      <FlashList
        estimatedItemSize={58} // 54px Height + 4px Margin Top
        data={listEntries}
        keyExtractor={(item) => item}
        renderItem={({ item, index }) => (
          <Swipeable
            containerClassName={cn("px-4", { "mt-1": index !== 0 })}
            renderRightActions={() => (
              <View className="pr-4">
                <IconButton
                  accessibilityLabel={t("template.entryRemove", { name: item })}
                  onPress={() => removePath({ list: listType, path: item })}
                  className="aspect-square grow bg-red"
                >
                  <Remove color={Colors.neutral100} />
                </IconButton>
              </View>
            )}
          >
            <Marquee
              color={surface}
              topOffset={16}
              wrapperClassName={cn(cardStyles, "min-h-12 px-0")}
            >
              <StyledText className="px-4">{item}</StyledText>
            </Marquee>
          </Swipeable>
        )}
        ListEmptyComponent={
          <StyledText center>{t("response.noFilters")}</StyledText>
        }
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-4"
      />
    </Sheet>
  );
}
//#endregion

//#region Form
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

  const selectDirectory = useCallback(async () => {
    try {
      const selectedPath = await pickPath();
      if (selectedPath) setNewPath(selectedPath);
    } catch {
      /* Catch weird `expo-file-system` SAF errors. */
    }
  }, []);

  return (
    <View className="flex-row gap-2 px-4">
      <View className="shrink grow flex-row items-center gap-2 border-b border-foreground/60">
        <TextInput
          autoFocus={false}
          editable={!onSubmit.isPending}
          value={newPath}
          onChangeText={(text) => setNewPath(text)}
          placeholder={PrimaryDirectoryPath}
          className="shrink grow"
        />
        <IconButton
          kind="ripple"
          accessibilityLabel={t("settings.related.pathSelect")}
          onPress={selectDirectory}
          disabled={onSubmit.isPending}
        >
          <CreateNewFolder />
        </IconButton>
      </View>
      <IconButton
        accessibilityLabel={t("settings.related.pathAdd")}
        onPress={() => {
          Keyboard.dismiss();
          mutateGuard(onSubmit, {
            list: props.listType,
            path: newPath,
            onSuccess: () => setNewPath(""),
          });
        }}
        disabled={!isValidPath || onSubmit.isPending}
        className="bg-red"
      >
        <Add color={Colors.neutral100} />
      </IconButton>
    </View>
  );
}
//#endregion
