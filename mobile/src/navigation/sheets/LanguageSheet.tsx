import { openBrowserAsync } from "expo-web-browser";
import { Pressable, View } from "react-native";

import { KeyboardArrowDown } from "~/resources/icons/KeyboardArrowDown";
import { OpenInNew } from "~/resources/icons/OpenInNew";
import { usePreferenceStore } from "~/stores/Preference/store";
import {
  PreferenceSetters,
  PreferenceTogglers,
} from "~/stores/Preference/actions";

import { TRANSLATIONS } from "~/constants/Links";
import { OnRTL } from "~/lib/react";
import { FlatList } from "~/components/Defaults";
import { ExtendedTButton } from "~/components/Form/Button";
import { ClickwrapCheckbox } from "~/components/Form/Checkbox";
import { RadioField } from "~/components/Form/Radio";
import { Marquee } from "~/components/Marquee";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { DetachedSheet } from "~/components/Sheet/Detached";
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
            <KeyboardArrowDown />
          </View>
        </Pressable>
        <View className="gap-1">
          <TEm textKey="feat.language.extra.translators" dim />
          <Marquee>
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
          onPress={() => openBrowserAsync(TRANSLATIONS)}
          RightElement={<OpenInNew size={20} />}
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
