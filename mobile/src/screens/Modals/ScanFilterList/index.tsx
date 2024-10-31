import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import {
  PrimaryDirectoryPath,
  StorageVolumesDirectoryPaths,
} from "@missingcore/react-native-metadata-retriever";
import { forwardRef, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Add, CreateNewFolder, Remove } from "@/icons";
import { useUserPreferencesStore } from "@/services/UserPreferences";
import { useTheme } from "@/hooks/useTheme";
import { pickPath, removePath, useAddPathToList, validatePath } from "./data";

import { Colors } from "@/constants/Styles";
import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import { Marquee, cardStyles } from "@/components/new/Containment";
import { IconButton, TextInput } from "@/components/new/Form";
import { ModalHeader, ModalSheet } from "@/components/new/Modal";
import { Swipeable } from "@/components/new/Swipeable";
import { StyledText } from "@/components/new/Typography";

//#region Modal
/** Modal that can be used to edit the paths in the allowlist or blocklist. */
export const ScanFilterListModal = forwardRef<
  BottomSheetModal,
  { listType: "listAllow" | "listBlock" }
>(function ScanFilterListModal({ listType }, ref) {
  const { t } = useTranslation();
  const { surface } = useTheme();
  const listEntries = useUserPreferencesStore((state) => state[listType]);

  return (
    <ModalSheet ref={ref} snapTop className="">
      <BottomSheetFlatList
        data={listEntries}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Swipeable
            containerClassName="px-4"
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
        showsVerticalScrollIndicator={false}
        // Sticky the modal header as otherwise, it will scroll with the content.
        stickyHeaderIndices={[0]}
        ListHeaderComponent={
          <FilterListHeader {...{ listType, listEntries }} />
        }
        ListEmptyComponent={
          <StyledText center>{t("response.noFilters")}</StyledText>
        }
        contentContainerClassName="gap-2 pb-4"
      />
    </ModalSheet>
  );
});
//#endregion

//#region Modal Header
/** Custom `ListHeaderComponent` for modal. */
function FilterListHeader({
  listType,
  listEntries,
}: {
  listType: "listAllow" | "listBlock";
  listEntries: string[];
}) {
  const { t } = useTranslation();
  const onSubmit = useAddPathToList();
  const [newPath, setNewPath] = useState("");

  const isValidPath = useMemo(() => {
    const trimmed = newPath.trim();
    return validatePath(newPath) && !listEntries.includes(trimmed);
  }, [listEntries, newPath]);

  const selectDirectory = useCallback(async () => {
    try {
      const selectedPath = await pickPath();
      if (selectedPath) setNewPath(selectedPath);
    } catch {
      /* Catch weird `expo-file-system` SAF errors. */
    }
  }, []);

  return (
    <View className="gap-4 bg-canvas px-4 pb-2 dark:bg-neutral5">
      <ModalHeader title={t(`title.${listType}`)} noPadding />
      <StyledText preset="dimOnCanvas" center className="text-sm">
        {t(`settings.description.${listType}`)}
        {listType === "listAllow" ? (
          <StyledText preset="dimOnSurface" className="text-xs">
            {"\n"}
            {StorageVolumesDirectoryPaths.map((dir) => `\n${dir}`)}
          </StyledText>
        ) : null}
      </StyledText>

      {/* "Input Form" */}
      <View className="flex-row gap-2">
        <View className="shrink grow flex-row items-center gap-2 border-b border-foreground/60">
          <TextInput
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
          onPress={() =>
            mutateGuard(onSubmit, {
              list: listType,
              path: newPath,
              onSuccess: () => setNewPath(""),
            })
          }
          disabled={!isValidPath || onSubmit.isPending}
          className="bg-red"
        >
          <Add color={Colors.neutral100} />
        </IconButton>
      </View>
    </View>
  );
}
//#endregion
