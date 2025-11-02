import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, View } from "react-native";

import { Add } from "~/resources/icons/Add";
import { CreateNewFolder } from "~/resources/icons/CreateNewFolder";
import { Delete } from "~/resources/icons/Delete";
import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";
import {
  pickPath,
  removePath,
  useAddPathToList,
  validatePath,
} from "./Sheets.utils";

import { Colors } from "~/constants/Styles";
import { mutateGuard } from "~/lib/react-query";
import { Marquee } from "~/components/Containment/Marquee";
import { FlatList } from "~/components/Defaults";
import { Button, IconButton } from "~/components/Form/Button";
import { TextInput } from "~/components/Form/Input";
import type { TrueSheetRef } from "~/components/Sheet";
import { NumericSheet, Sheet } from "~/components/Sheet";
import { Swipeable } from "~/components/Swipeable";
import { StyledText } from "~/components/Typography/StyledText";
import { deferInitialRender } from "../../../components/DeferredRender";
import { ContentPlaceholder } from "../../../components/Placeholder";

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
  const listEntries = usePreferenceStore((s) => s[listType]);

  return (
    <Sheet
      ref={sheetRef}
      titleKey={`feat.${listType}.title`}
      keyboardMode="pan"
      contentContainerClassName="px-0"
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
            onSwipeLeft={() => removePath({ list: listType, path: item })}
            RightIcon={<Delete color={Colors.neutral100} />}
            rightIconContainerClassName="rounded-md bg-red"
            wrapperClassName="mx-4"
          >
            <Marquee
              color="surface"
              wrapperClassName="rounded-md bg-surface"
              contentContainerClassName="py-4"
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

  const selectDirectory = async () => {
    try {
      const selectedPath = await pickPath();
      if (selectedPath) setNewPath(selectedPath);
    } catch {
      /* Catch weird `expo-file-system` SAF errors. */
    }
  };

  return (
    <View className="flex-row gap-2 px-4">
      {/* FIXME: Noticed w/ RN 0.79, but having a border seems to contribute to the height when it shouldn't. */}
      <View className="h-12 shrink grow flex-row items-center gap-2 border-b border-foreground/60">
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
//#endregion

//#region Min Duration
/** Enables us to specify the minimum track duration we want to save. */
function MinDurationSheet(props: { sheetRef: TrueSheetRef }) {
  const minSeconds = usePreferenceStore((s) => s.minSeconds);
  return (
    <NumericSheet
      sheetRef={props.sheetRef}
      titleKey="feat.ignoreDuration.title"
      descriptionKey="feat.ignoreDuration.description"
      value={minSeconds}
      setValue={PreferenceSetters.setMinSeconds}
    />
  );
}
//#endregion
