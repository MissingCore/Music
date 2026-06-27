// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { Icon } from "~/resources/icons";
import { usePreferenceStore } from "~/stores/Preference/store";
import {
  PreferenceSetters,
  PreferenceTogglers,
} from "~/stores/Preference/actions";

import { OnRTL } from "~/lib/react";
import { Links, openLink } from "~/lib/web-browser";
import { FlatList } from "~/components/Base/List";
import { Pressable } from "~/components/Base/Pressable";
import { ExtendedTButton } from "~/components/Form/Button";
import { ClickwrapCheckbox } from "~/components/Form/Checkbox";
import { RadioField } from "~/components/Form/Radio";
import { Marquee } from "~/components/Marquee";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { DetachedSheet } from "~/components/Sheet";
import {
  DetachedDimView,
  useDetachedDimViewContext,
} from "~/components/Sheet/DetachedDimView";
import { StyledText, TEm } from "~/components/Typography/StyledText";
import { LANGUAGES } from "~/modules/i18n/constants";

export function LanguageSheet(props: { ref: TrueSheetRef }) {
  const languageCode = usePreferenceStore((s) => s.language);
  const forceLTR = usePreferenceStore((s) => s.forceLTR);
  const languageSelectionSheetRef = useSheetRef();
  const { dimViewHandlers, dimness } = useDetachedDimViewContext();

  const selectedLanguage = LANGUAGES.find(({ code }) => code === languageCode);
  const translatorsString = selectedLanguage?.translators
    .map(({ display }) => display)
    .join(", ");

  return (
    <>
      <DetachedSheet ref={props.ref} titleKey="feat.language.title">
        <Pressable
          onPress={() => languageSelectionSheetRef.current?.present()}
          className="min-h-10 flex-row items-center justify-between gap-1 border-b border-outline active:opacity-50"
        >
          <StyledText>{selectedLanguage?.name}</StyledText>
          <View className={OnRTL.decide("rotate-90", "-rotate-90")}>
            <Icon name="keyboard-arrow-down" />
          </View>
        </Pressable>
        <View className="gap-1">
          <TEm textKey="feat.language.extra.translators" dim />
          <Marquee color="surfaceBright">
            <StyledText className="text-xs">{translatorsString}</StyledText>
          </Marquee>
        </View>
        {selectedLanguage?.rtl ? (
          <ClickwrapCheckbox
            textKey="feat.language.extra.useLTR"
            checked={forceLTR}
            onCheck={PreferenceTogglers.toggleForceLTR}
          />
        ) : null}

        <ExtendedTButton
          textKey="feat.language.extra.contribute"
          onPress={() => openLink(Links.Translations)}
          RightElement={<Icon name="open-in-new" size={20} />}
          className="rounded-full"
        />

        <DetachedDimView dimness={dimness} />
      </DetachedSheet>

      <DetachedSheet
        ref={languageSelectionSheetRef}
        snapTop
        {...dimViewHandlers}
      >
        <FlatList
          accessibilityRole="radiogroup"
          data={LANGUAGES}
          keyExtractor={({ code }) => code}
          renderItem={({ item }) => (
            <RadioField
              selected={languageCode === item.code}
              onSelect={async () => {
                await PreferenceSetters.setLanguage(item.code);
                languageSelectionSheetRef.current?.dismiss();
              }}
            >
              <StyledText>{item.name}</StyledText>
            </RadioField>
          )}
          nestedScrollEnabled
          contentContainerClassName="gap-2 pb-4"
        />
      </DetachedSheet>
    </>
  );
}
