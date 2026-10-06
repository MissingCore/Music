// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useTranslation } from "react-i18next";
import { Keyboard, View } from "react-native";

import i18next from "~/modules/i18n";
import { preferenceStore, usePreferenceStore } from "~/stores/Preference/store";

import { TextInput } from "~/components/Form/Input";
import { IconButton } from "~/components/next/base/button-icon";
import { Divider } from "~/components/next/base/divider";
import { Icon } from "~/components/next/base/icon";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { Text, TText } from "~/components/next/base/typography";
import { Marquee } from "~/components/next/blocks/marquee";
import { useInputForm } from "~/modules/form/useInputForm";

export function SeparatorsSheet(props: { ref: SheetRef }) {
  const { t } = useTranslation();
  const delimiters = usePreferenceStore((s) => s.separators);
  return (
    <Sheet ref={props.ref} snapTop>
      <Sheet.Header label={t("feat.separators.title")}>
        <TText textKey="feat.separators.description.line1" muted size="sm" />
        <SeparatorForm />
      </Sheet.Header>
      <Sheet.List
        estimatedItemSize={46} // 40px Height + 6px Margin Bottom
        data={delimiters}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between gap-2">
            <Marquee>
              <Text>{item}</Text>
            </Marquee>
            <IconButton
              icon="close"
              accessibilityLabel={t("template.entryRemove", { name: item })}
              onPress={() => removeSeparator(item)}
            />
          </View>
        )}
        contentContainerClassName="gap-1.5 pt-4 pr-1"
      />
      <Sheet.Footer className="gap-6">
        <Divider />
        <View className="flex-row gap-2 pb-2">
          <Icon name="info" size={16} color="onSurfaceVariant" />
          <TText
            textKey="feat.separators.description.line2"
            muted
            className="shrink grow"
          />
        </View>
      </Sheet.Footer>
    </Sheet>
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
    <View className="flex-row gap-2 pt-4">
      <TextInput
        editable={!inputForm.isSubmitting}
        value={inputForm.value}
        onChangeText={inputForm.onChange}
        className="shrink grow border-b border-outline"
        forSheet
      />
      <IconButton
        icon="add"
        accessibilityLabel={t("template.entryAdd", { name: inputForm.value })}
        onPress={async () => {
          Keyboard.dismiss();
          await inputForm.onSubmit();
        }}
        disabled={!inputForm.canSubmit || inputForm.isSubmitting}
        intent="primary"
        filled
        size="md"
        className="rounded-md"
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
  toast(i18next.t("template.entryRemoved", { name: removedSeparator }));
}
//#endregion
