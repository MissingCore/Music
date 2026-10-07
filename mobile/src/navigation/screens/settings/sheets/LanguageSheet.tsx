// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";
import {
  PreferenceSetters,
  PreferenceTogglers,
} from "~/stores/Preference/actions";

import { Links, openLink } from "~/lib/web-browser";
import { ClickwrapCheckbox } from "~/components/Form/Checkbox";
import { Icon } from "~/components/next/base/icon";
import { Ripple } from "~/components/next/base/ripple";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet, useSheetRef } from "~/components/next/base/sheet";
import { Text, TText } from "~/components/next/base/typography";
import { ActionButton } from "~/components/next/blocks/button-action";
import { Marquee } from "~/components/next/blocks/marquee";
import { RadioSheet } from "~/components/next/composed/sheet-radio";
import { LANGUAGES } from "~/modules/i18n/constants";

export function LanguageSheet(props: { ref: SheetRef }) {
  const { t } = useTranslation();
  const languageCode = usePreferenceStore((s) => s.language);
  const forceLTR = usePreferenceStore((s) => s.forceLTR);
  const languageSelectionSheetRef = useSheetRef();

  const selectedLanguage = LANGUAGES.find(({ code }) => code === languageCode);
  const translatorsString = selectedLanguage?.translators
    .map(({ display }) => display)
    .join(", ");

  return (
    <>
      <Sheet ref={props.ref}>
        <Sheet.Header label={t("feat.language.title")} />

        <Ripple
          onPress={() => {
            languageSelectionSheetRef.current?.present();
            props.ref.current?.dismiss();
          }}
          className="min-h-10 flex-row items-center gap-1 border-b border-outline"
        >
          <Text className="shrink grow pl-1">{selectedLanguage?.label}</Text>
          <View className="-rotate-90 rtl:rotate-90">
            <Icon name="keyboard-arrow-down" />
          </View>
        </Ripple>
        <View className="gap-1">
          <TText textKey="feat.language.extra.translators" bold muted />
          <Marquee>
            <Text size="xs">{translatorsString}</Text>
          </Marquee>
        </View>
        {selectedLanguage?.rtl ? (
          <ClickwrapCheckbox
            textKey="feat.language.extra.useLTR"
            checked={forceLTR}
            onCheck={PreferenceTogglers.toggleForceLTR}
          />
        ) : null}

        <ActionButton
          label={t("feat.language.extra.contribute")}
          onPress={() => openLink(Links.Translations)}
          trailingIcon="open-in-new"
          className="rounded-full"
        />
      </Sheet>

      <RadioSheet
        ref={languageSelectionSheetRef}
        data={LANGUAGES}
        onSelect={async (item) => {
          await props.ref.current?.present();
          PreferenceSetters.setLanguage(item.code);
        }}
        isSelected={(item) => languageCode === item.code}
      />
    </>
  );
}
