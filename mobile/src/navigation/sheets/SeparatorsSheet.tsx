import { useTranslation } from "react-i18next";
import { Keyboard, View } from "react-native";

import { Add } from "~/resources/icons/Add";
import { Close } from "~/resources/icons/Close";
import { Info } from "~/resources/icons/Info";
import { preferenceStore, usePreferenceStore } from "~/stores/Preference/store";
import { useInputForm } from "~/hooks/useInputForm";
import { useTheme } from "~/hooks/useTheme";

import { Colors } from "~/constants/Styles";
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
  const { foreground } = useTheme();
  const delimiters = usePreferenceStore((s) => s.separators);
  const sheetListHandlers = useEnableSheetScroll();

  return (
    <DetachedSheet
      ref={props.ref}
      titleKey="feat.separators.title"
      keyboardAndToast
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
            <Marquee color="canvasAlt">
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
        contentContainerClassName="gap-2"
      />

      <Divider />
      <View className="flex-row gap-2">
        <Info size={16} color={`${foreground}99`} />
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
    onConstraints: (separator) => {
      const trimmed = separator.trim();
      return trimmed !== "" && !delimiters.includes(trimmed);
    },
  });

  return (
    <View className="flex-row gap-2">
      {/* FIXME: Noticed w/ RN 0.79, but having a border seems to contribute to the height when it shouldn't. */}
      <TextInput
        editable={!inputForm.isSubmitting}
        value={inputForm.value}
        onChangeText={inputForm.onChange}
        className="h-12 shrink grow border-b border-foreground/10"
        forSheet
      />
      <FilledIconButton
        Icon={Add}
        accessibilityLabel={t("template.entryAdd", { name: "" })}
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
