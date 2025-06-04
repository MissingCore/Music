import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, View } from "react-native";

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
import { deferInitialRender } from "~/lib/react";
import { mutateGuard } from "~/lib/react-query";
import { Marquee } from "~/components/Containment/Marquee";
import { FlatList } from "~/components/Defaults";
import { Button, NextIconButton } from "~/components/Form/Button";
import { NumericInput, TextInput } from "~/components/Form/Input";
import { ContentPlaceholder } from "~/components/Transition/Placeholder";
import type { TrueSheetRef } from "~/components/Sheet";
import { Sheet } from "~/components/Sheet";
import { Swipeable } from "~/components/Swipeable";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

/** All the sheets used on `/setting/scanning` route. */
export const ScanningSettingsSheets = deferInitialRender(
  function ScanningSettingsSheets(
    props: Record<
      "allowListRef" | "blockListRef" | "minDurationRef",
      TrueSheetRef
    >,
  ) {
    return (
      <>
        <ScanFilterListSheet
          listType="listAllow"
          sheetRef={props.allowListRef}
        />
        <ScanFilterListSheet
          listType="listBlock"
          sheetRef={props.blockListRef}
        />
        <MinDurationSheet sheetRef={props.minDurationRef} />
      </>
    );
  },
);

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
      {listType === "listBlock" ? (
        <StyledText dim center className="px-4 text-sm">
          {t("feat.listBlock.description")}
        </StyledText>
      ) : null}
      <FilterForm listType={listType} listEntries={listEntries} />

      <FlatList
        data={listEntries}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Swipeable
            containerClassName="px-4"
            renderRightActions={() => (
              <Button
                accessibilityLabel={t("template.entryRemove", { name: item })}
                onPress={() => removePath({ list: listType, path: item })}
                className="mr-4 aspect-square h-full min-w-12 bg-red p-3"
              >
                <Remove color={Colors.neutral100} />
              </Button>
            )}
          >
            <Marquee
              color={surface}
              topOffset={16}
              wrapperClassName="py-4 rounded-md bg-surface"
            >
              <StyledText className="px-4">{item}</StyledText>
            </Marquee>
          </Swipeable>
        )}
        ListEmptyComponent={
          <ContentPlaceholder errMsgKey="err.msg.noFilters" />
        }
        nestedScrollEnabled
        contentContainerClassName="gap-1 pb-4"
      />
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
          editable={!onSubmit.isPending}
          value={newPath}
          onChangeText={(text) => setNewPath(text)}
          placeholder="/storage/emulated/0"
          className="shrink grow"
        />
        <NextIconButton
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
        className="min-w-12 bg-red p-3"
      >
        <Add color={Colors.neutral100} />
      </Button>
    </View>
  );
}
//#endregion

/** Enables us to specify the minimum track duration we want to save. */
function MinDurationSheet(props: { sheetRef: TrueSheetRef }) {
  const minSeconds = useUserPreferencesStore((state) => state.minSeconds);
  const [newMin, setNewMin] = useState<string | undefined>();

  useEffect(() => {
    const subscription = Keyboard.addListener(
      "keyboardDidHide",
      // Update user preference when we close the keyboard.
      () => updateMinDuration(newMin),
    );
    return () => subscription.remove();
  }, [newMin]);

  return (
    <Sheet
      ref={props.sheetRef}
      titleKey="feat.ignoreDuration.title"
      contentContainerClassName="gap-4"
    >
      <TStyledText
        dim
        textKey="feat.ignoreDuration.description"
        className="text-center text-sm"
      />
      <NumericInput
        defaultValue={`${minSeconds}`}
        onChangeText={(text) => setNewMin(text)}
        className="mx-auto w-full max-w-[50%] border-b border-foreground/60 text-center"
      />
    </Sheet>
  );
}

//#region Helpers
async function updateMinDuration(newDuration: string | undefined) {
  const asNum = Number(newDuration);
  // Validate that it's a positive integer.
  if (!Number.isInteger(asNum) || asNum < 0) return;
  userPreferencesStore.setState({ minSeconds: asNum });
}
//#endregion
