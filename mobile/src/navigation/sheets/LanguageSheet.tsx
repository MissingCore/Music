import { openBrowserAsync } from "expo-web-browser";
import { Pressable, View } from "react-native";

import { KeyboardArrowDown } from "~/resources/icons/KeyboardArrowDown";
import { OpenInNew } from "~/resources/icons/OpenInNew";
import { usePreferenceStore } from "~/stores/Preference/store";
import {
  PreferenceSetters,
  PreferenceTogglers,
} from "~/stores/Preference/actions";
import { LANGUAGES } from "~/modules/i18n/constants";

import { TRANSLATIONS } from "~/constants/Links";
import { cn } from "~/lib/style";
import { Marquee } from "~/components/Containment/Marquee";
import { FlatList } from "~/components/Defaults";
import { Button } from "~/components/Form/Button";
import { Radio } from "~/components/Form/Selection";
import type { TrueSheetRef } from "~/components/Sheet";
import { useSheetRef } from "~/components/Sheet";
import { DetachedSheet } from "~/components/Sheet/Detached";
import {
  StyledText,
  TEm,
  TStyledText,
} from "~/components/Typography/StyledText";

export function LanguageSheet(props: { sheetRef: TrueSheetRef }) {
  const languageCode = usePreferenceStore((s) => s.language);
  const ignoreRTLLayout = usePreferenceStore((s) => s.ignoreRTLLayout);
  const languageSheetRef = useSheetRef();

  const selectedLanguage = LANGUAGES.find(({ code }) => code === languageCode);
  const translatorsString = selectedLanguage?.translators
    .map(({ display }) => display)
    .join(", ");

  return (
    <>
      <DetachedSheet ref={props.sheetRef} titleKey="feat.language.title">
        <Pressable
          onPress={() => languageSheetRef.current?.present()}
          className="min-h-10 flex-row items-center justify-between gap-1 border-b border-foreground/10"
        >
          <StyledText>{selectedLanguage?.name}</StyledText>
          <View className="-rotate-90">
            <KeyboardArrowDown />
          </View>
        </Pressable>
        <View className="gap-1">
          <TEm textKey="feat.translate.extra.translators" dim />
          <Marquee>
            <StyledText className="text-xs">{translatorsString}</StyledText>
          </Marquee>
        </View>
        {(selectedLanguage?.rtl ?? false) ? (
          <Pressable
            onPress={PreferenceTogglers.toggleIgnoreRTLLayout}
            className="flex-row items-center gap-2"
          >
            <View
              className={cn("size-4 rounded-xs border border-foreground", {
                "bg-foreground": ignoreRTLLayout,
              })}
            />
            <TStyledText
              textKey="feat.ignoreRTLLayout.brief"
              className="shrink grow text-sm"
            />
          </Pressable>
        ) : null}
        <Button
          onPress={() => openBrowserAsync(TRANSLATIONS)}
          className="flex-row rounded-full py-2"
        >
          <TStyledText
            textKey="feat.translate.title"
            bold
            className="text-sm"
          />
          <OpenInNew size={20} />
        </Button>
      </DetachedSheet>

      <DetachedSheet ref={languageSheetRef} scrollable snapTop>
        <FlatList
          accessibilityRole="radiogroup"
          data={LANGUAGES}
          keyExtractor={({ code }) => code}
          renderItem={({ item }) => (
            <Radio
              selected={languageCode === item.code}
              onSelect={() => PreferenceSetters.setLanguage(item.code)}
            >
              <StyledText>{item.name}</StyledText>
            </Radio>
          )}
          nestedScrollEnabled
          contentContainerClassName="gap-1 pb-4"
        />
      </DetachedSheet>
    </>
  );
}
