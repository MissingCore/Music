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
import { FilledIconButton } from "~/components/next/base/button-icon";
import { Divider } from "~/components/next/base/divider";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet, SheetFooter } from "~/components/next/base/sheet";
import { Text, TText } from "~/components/next/base/typography";
import { ClickwrapCheckbox } from "~/components/next/blocks/checkbox";
import { Marquee } from "~/components/next/blocks/marquee";
import { SheetRadioList } from "~/components/next/composed/sheet-radio";
import { LANGUAGES } from "~/modules/i18n/constants";

export function LanguageSheet(props: { ref: SheetRef }) {
  const { t } = useTranslation();
  const languageCode = usePreferenceStore((s) => s.language);
  const forceLTR = usePreferenceStore((s) => s.forceLTR);

  const selectedLanguage = LANGUAGES.find(({ code }) => code === languageCode);
  const translatorsString = selectedLanguage?.translators
    .map(({ display }) => display)
    .join(", ");

  return (
    <Sheet
      ref={props.ref}
      footer={
        <SheetFooter className="pt-0">
          <Divider />
          <View className="flex-row items-center gap-4">
            <View className="shrink grow gap-1">
              <TText textKey="feat.language.extra.translators" bold muted />
              <Marquee>
                <Text size="xs">{translatorsString}</Text>
              </Marquee>
            </View>
            <FilledIconButton
              icon={`north-${OnRTL.decide("west", "east")}`}
              accessibilityLabel={t("feat.language.extra.contribute")}
              onPress={() => openLink(Links.Translations)}
              intent="inverse"
            />
          </View>
          {selectedLanguage?.rtl ? (
            <ClickwrapCheckbox
              textKey="feat.language.extra.useLTR"
              checked={forceLTR}
              onCheck={PreferenceTogglers.toggleForceLTR}
            />
          ) : null}
        </SheetFooter>
      }
    >
      <SheetRadioList
        data={LANGUAGES}
        onSelect={(item) => PreferenceSetters.setLanguage(item.code)}
        isSelected={(item) => languageCode === item.code}
      />
    </Sheet>
  );
}
