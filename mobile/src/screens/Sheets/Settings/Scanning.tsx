import {
  PrimaryDirectoryPath,
  StorageVolumesDirectoryPaths,
} from "@missingcore/react-native-metadata-retriever";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Add } from "~/icons/Add";
import { CreateNewFolder } from "~/icons/CreateNewFolder";
import { Remove } from "~/icons/Remove";
import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { useTheme } from "~/hooks/useTheme";
import {
  pickPath,
  removePath,
  useAddPathToList,
  validatePath,
} from "./helpers/ScanFilterData";

import { Colors } from "~/constants/Styles";
import { mutateGuard } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { Marquee } from "~/components/Containment/Marquee";
import { FlashList } from "~/components/Defaults";
import { IconButton } from "~/components/Form/Button";
import { NumericInput, TextInput, useInputRef } from "~/components/Form/Input";
import type { TrueSheetRef } from "~/components/Sheet";
import { Sheet } from "~/components/Sheet";
import { Swipeable } from "~/components/Swipeable";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

/** All the sheets used on `/setting/scanning` route. */
export function ScanningSettingsSheets(
  props: Record<
    "allowListRef" | "blockListRef" | "minDurationRef",
    TrueSheetRef
  >,
) {
  return (
    <>
      <ScanFilterListSheet listType="listAllow" sheetRef={props.allowListRef} />
      <ScanFilterListSheet listType="listBlock" sheetRef={props.blockListRef} />
      <MinDurationSheet sheetRef={props.minDurationRef} />
    </>
  );
}

//#region Filter List
/** Enables us to specify the paths in the allowlist or blocklist. */
function ScanFilterListSheet({
  listType,
  sheetRef,
}: {
  listType: "listAllow" | "listBlock";
  sheetRef: TrueSheetRef;
}) {
  const { t } = useTranslation();
  const { surface } = useTheme();
  const listEntries = useUserPreferencesStore((state) => state[listType]);

  return (
    <Sheet
      ref={sheetRef}
      titleKey={`feat.${listType}.title`}
      keyboardMode="pan"
      contentContainerClassName="gap-4 px-0"
      snapTop
    >
      <StyledText dim center className="px-4 text-sm">
        {t(`feat.${listType}.description`)}
        {listType === "listAllow" ? (
          <StyledText className="text-xs text-foreground/50">
            {"\n"}
            {StorageVolumesDirectoryPaths.map((dir) => `\n${dir}`)}
          </StyledText>
        ) : null}
      </StyledText>
      <FilterForm {...{ listType, listEntries }} />

      <GestureHandlerRootView>
        <FlashList
          estimatedItemSize={58} // 54px Height + 4px Margin Top
          data={listEntries}
          keyExtractor={(item) => item}
          renderItem={({ item, index }) => (
            <Swipeable
              containerClassName={cn("px-4", { "mt-1": index > 0 })}
              renderRightActions={() => (
                <View className="pr-4">
                  <IconButton
                    accessibilityLabel={t("template.entryRemove", {
                      name: item,
                    })}
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
                wrapperClassName="min-h-12 py-4 rounded-md bg-surface"
              >
                <StyledText className="px-4">{item}</StyledText>
              </Marquee>
            </Swipeable>
          )}
          nestedScrollEnabled
          contentContainerClassName="pb-4"
          emptyMsgKey="err.msg.noFilters"
        />
      </GestureHandlerRootView>
    </Sheet>
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
          accessibilityLabel={t("feat.directory.extra.select")}
          onPress={selectDirectory}
          disabled={onSubmit.isPending}
        >
          <CreateNewFolder />
        </IconButton>
      </View>
      <IconButton
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
        className="bg-red"
      >
        <Add color={Colors.neutral100} />
      </IconButton>
    </View>
  );
}
//#endregion

/** Enables us to specify the minimum track duration we want to save. */
function MinDurationSheet(props: { sheetRef: TrueSheetRef }) {
  const minSeconds = useUserPreferencesStore((state) => state.minSeconds);
  const inputRef = useInputRef();
  const [disabled, setDisabled] = useState(false);
  const [newMin, setNewMin] = useState<string | undefined>();

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
    setDisabled(true);
  }, [inputRef]);

  const focusInputDelayed = useCallback(() => {
    inputRef.current?.blur();
    setTimeout(focusInput, 50);
  }, [inputRef, focusInput]);

  const unfocusInput = useCallback(() => {
    inputRef.current?.blur();
    setDisabled(false);
  }, [inputRef]);

  useEffect(() => {
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      // Update user preference when we close the keyboard.
      updateMinDuration(newMin);
    });
    return () => {
      hideSubscription.remove();
    };
  }, [newMin]);

  return (
    <Sheet
      ref={props.sheetRef}
      titleKey="feat.ignoreDuration.title"
      // FIXME: Current hacked solution to auto-focus on input when sheet
      // appears (input gets focused but keyboard doesn't appear).
      onPresent={focusInputDelayed}
      onDismiss={unfocusInput}
      contentContainerClassName="gap-4"
    >
      <TStyledText
        dim
        textKey="feat.ignoreDuration.description"
        className="text-center text-sm"
      />
      <View className="relative mx-auto w-full max-w-[50%]">
        <NumericInput
          ref={inputRef}
          defaultValue={`${minSeconds}`}
          onChangeText={(text) => setNewMin(text)}
          onBlur={unfocusInput}
          className="border-b border-foreground/60 text-center"
        />
        <Pressable
          aria-hidden
          // FIXME: Current hacked solution to get input focus to work.
          onPress={focusInput}
          disabled={disabled}
          pointerEvents={disabled ? "none" : "auto"}
          className="absolute left-0 top-0 size-full"
        />
      </View>
    </Sheet>
  );
}

//#region Helpers
async function updateMinDuration(newDuration: string | undefined) {
  const asNum = Number(newDuration);
  // Validate that it's a positive integer.
  if (!Number.isInteger(asNum) || asNum < 0) return;
  userPreferencesStore.setState({ minSeconds: asNum });
  return;
}
//#endregion
