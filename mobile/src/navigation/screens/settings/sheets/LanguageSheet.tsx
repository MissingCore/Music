// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";
import {
  PreferenceSetters,
  PreferenceTogglers,
} from "~/stores/Preference/actions";

import { OnRTL } from "~/lib/react";
import { Links, openLink } from "~/lib/web-browser";
import { ClickwrapCheckbox } from "~/components/Form/Checkbox";
import { Button } from "~/components/next/base/button";
import { Divider } from "~/components/next/base/divider";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { Text, TText } from "~/components/next/base/typography";
import { Marquee } from "~/components/next/blocks/marquee";
import { LANGUAGES } from "~/modules/i18n/constants";
import { IconButton } from "~/components/next/base/button-icon";

export function LanguageSheet(props: { ref: SheetRef }) {
  const { t } = useTranslation();
  const languageCode = usePreferenceStore((s) => s.language);
  const forceLTR = usePreferenceStore((s) => s.forceLTR);

  const selectedLanguage = LANGUAGES.find(({ code }) => code === languageCode);
  const translatorsString = selectedLanguage?.translators
    .map(({ display }) => display)
    .join(", ");

  return (
    <Sheet ref={props.ref}>
      <Sheet.List
        estimatedItemSize={54} // 48px Height + 6px Margin Bottom
        data={LANGUAGES}
        keyExtractor={(item) => item.label}
        extraData={languageCode}
        renderItem={({ item }) => {
          const isSelected = languageCode === item.code;
          return (
            <Button
              onPress={() => PreferenceSetters.setLanguage(item.code)}
              filled={isSelected}
              disabled={isSelected}
              className="mb-1.5 rounded-md py-2 disabled:opacity-100"
            >
              <Text size="lg">{item.label}</Text>
            </Button>
          );
        }}
      />
      <Sheet.Footer>
        <Divider />
        <View className="flex-row items-center gap-4">
          <View className="shrink grow gap-1">
            <TText textKey="feat.language.extra.translators" bold muted />
            <Marquee>
              <Text size="xs">{translatorsString}</Text>
            </Marquee>
          </View>
          <IconButton
            icon={`north-${OnRTL.decide("west", "east")}`}
            accessibilityLabel={t("feat.language.extra.contribute")}
            onPress={() => openLink(Links.Translations)}
            filled
          />
        </View>
        {selectedLanguage?.rtl ? (
          <ClickwrapCheckbox
            textKey="feat.language.extra.useLTR"
            checked={forceLTR}
            onCheck={PreferenceTogglers.toggleForceLTR}
            className="gap-3 rounded-lg border border-outlineVariant p-3"
          />
        ) : null}
      </Sheet.Footer>
    </Sheet>
  );
}
