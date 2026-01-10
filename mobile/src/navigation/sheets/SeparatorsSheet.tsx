import { useTranslation } from "react-i18next";
import { Keyboard, View } from "react-native";

import { Add } from "~/resources/icons/Add";
import { Close } from "~/resources/icons/Close";
import { Info } from "~/resources/icons/Info";
import { preferenceStore, usePreferenceStore } from "~/stores/Preference/store";
import { useInputForm } from "~/hooks/useInputForm";

import { FlatList } from "~/components/Defaults";
import { Divider } from "~/components/Divider";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { TextInput } from "~/components/Form/Input";
import { Marquee } from "~/components/Marquee";
import { DetachedSheet } from "~/components/Sheet/Detached";
import { useEnableSheetScroll } from "~/components/Sheet/useEnableSheetScroll";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

export function SeparatorsSheet(props: { ref: TrueSheetRef }) {
  const { t } = useTranslation();
  const delimiters = usePreferenceStore((s) => s.separators);
  const sheetListHandlers = useEnableSheetScroll();

  return (
    <DetachedSheet
      ref={props.ref}
      titleKey="feat.separators.title"
      snapTop
      contentContainerClassName="pb-4"
    >
      <TStyledText
        textKey="feat.separators.description.line1"
        dim
        className="text-sm"
      />
      <SeparatorForm />
      <FlatList
        data={delimiters}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between gap-2">
            <Marquee color="surfaceBright">
              <StyledText>{item}</StyledText>
            </Marquee>
            <IconButton
              Icon={Close}
              accessibilityLabel={t("template.entryRemove", { name: item })}
              onPress={() => removeSeparator(item)}
            />
          </View>
        )}
        {...sheetListHandlers}
        className="-my-6"
        contentContainerClassName="gap-2 pt-6 pb-4"
      />

      <Divider />
      <View className="flex-row gap-2 pb-2">
        <Info size={16} color="onSurfaceVariant" />
        <TStyledText
          textKey="feat.separators.description.line2"
          dim
          className="shrink grow"
        />
      </View>
    </DetachedSheet>
  );
}

//#region Form
function SeparatorForm() {
  const { t } = useTranslation();
  const delimiters = usePreferenceStore((s) => s.separators);
  const inputForm = useInputForm({
    onSubmit: (trimmedSeparator) => {
      preferenceStore.setState((prev) => ({
        separators: [...prev.separators, trimmedSeparator],
      }));
    },
    onConstraints: (trimmedSeparator) => !delimiters.includes(trimmedSeparator),
  });

  return (
    <View className="flex-row gap-2">
      <TextInput
        editable={!inputForm.isSubmitting}
        value={inputForm.value}
        onChangeText={inputForm.onChange}
        className="shrink grow border-b border-onSurface/10"
        forSheet
      />
      <FilledIconButton
        Icon={Add}
        accessibilityLabel={t("template.entryAdd", { name: inputForm.value })}
        onPress={async () => {
          Keyboard.dismiss();
          await inputForm.onSubmit();
        }}
        disabled={!inputForm.canSubmit || inputForm.isSubmitting}
        className="rounded-md bg-primary active:bg-primaryDim"
        _iconColor="onPrimary"
      />
    </View>
  );
}
//#endregion

//#region Helpers
function removeSeparator(removedSeparator: string) {
  preferenceStore.setState((prev) => ({
    separators: prev.separators.filter(
      (separator) => separator !== removedSeparator,
    ),
  }));
}
//#endregion
