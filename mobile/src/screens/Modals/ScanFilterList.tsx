import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import {
  PrimaryDirectoryPath,
  StorageVolumesDirectoryPaths,
} from "@missingcore/react-native-metadata-retriever";
import { forwardRef, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Add, CreateNewFolder, Remove } from "@/resources/icons";
import { useUserPreferencesStore } from "@/services/UserPreferences";
import {
  pickPath,
  removePath,
  useAddPathToList,
  validatePath,
} from "./ScanFilterList.data";

import { Colors } from "@/constants/Styles";
import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import { cardStyles } from "@/components/new/Card";
import { Button, StyledPressable, TextInput } from "@/components/new/Form";
import { Marquee } from "@/components/new/Marquee";
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
                <Button
                  accessibilityLabel={t("template.entryRemove", { name: item })}
                  preset="danger"
                  onPress={() => removePath({ list: listType, path: item })}
                  icon
                  className="aspect-square grow items-center"
                >
                  <Remove color={Colors.neutral100} />
                </Button>
              </View>
            )}
          >
            <View className={cn(cardStyles, "min-h-12 px-0")}>
              <Marquee>
                <StyledText className="px-4">{item}</StyledText>
              </Marquee>
            </View>
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
            base="gorhom"
            editable={!onSubmit.isPending}
            value={newPath}
            onChangeText={(text) => setNewPath(text)}
            placeholder={PrimaryDirectoryPath}
            className="shrink grow"
          />
          <StyledPressable
            accessibilityLabel={t("settings.related.pathSelect")}
            disabled={onSubmit.isPending}
            onPress={selectDirectory}
            forIcon
          >
            <CreateNewFolder />
          </StyledPressable>
        </View>
        <Button
          accessibilityLabel={t("settings.related.pathAdd")}
          preset="danger"
          disabled={!isValidPath || onSubmit.isPending}
          onPress={() =>
            mutateGuard(onSubmit, {
              list: listType,
              path: newPath,
              onSuccess: () => setNewPath(""),
            })
          }
        >
          <Add color={Colors.neutral100} />
        </Button>
      </View>
    </View>
  );
}
//#endregion
