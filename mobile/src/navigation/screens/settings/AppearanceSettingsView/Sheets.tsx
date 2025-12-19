import { Text } from "react-native";
import { Uniwind } from "uniwind";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { getFont } from "~/lib/style";
import { toLowerCase } from "~/utils/string";
import { FlatList } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import { Sheet } from "~/components/Sheet";
import { NumericSheet } from "~/components/Sheet/Numeric";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { TStyledText } from "~/components/Typography/StyledText";
import type { AccentFont } from "~/stores/Preference/constants";
import {
  AccentFontOptions,
  NowPlayingDesignOptions,
  PrimaryFontOptions,
  ThemeOptions,
} from "~/stores/Preference/constants";
import { deferInitialRender } from "../../../components/DeferredRender";

/** All the sheets used on `/setting/appearance` route. */
export const AppearanceSettingsSheets = deferInitialRender(
  function AppearanceSettingsSheets(props: {
    accentFontRef: TrueSheetRef;
    primaryFontRef: TrueSheetRef;
    themeRef: TrueSheetRef;
    albumLengthFilterRef: TrueSheetRef;
    nowPlayingDesignRef: TrueSheetRef;
  }) {
    return (
      <>
        <FontAccentSheet ref={props.accentFontRef} />
        <FontPrimarySheet ref={props.primaryFontRef} />
        <ThemeSheet ref={props.themeRef} />
        <MinAlbumLengthSheet ref={props.albumLengthFilterRef} />
        <NowPlayingDesignSheet ref={props.nowPlayingDesignRef} />
      </>
    );
  },
);

//#region Font
/** Enables changing the font used primarily for headings. */
function FontAccentSheet(props: { ref: TrueSheetRef }) {
  const accentFont = usePreferenceStore((s) => s.accentFont);
  return (
    <FontSheet
      ref={props.ref}
      kind="Accent"
      selectedFont={accentFont}
      fontOptions={AccentFontOptions}
      updateFont={PreferenceSetters.setAccentFont}
    />
  );
}

/** Enables changing the font used by all text in the app. */
function FontPrimarySheet(props: { ref: TrueSheetRef }) {
  const primaryFont = usePreferenceStore((s) => s.primaryFont);
  return (
    <FontSheet
      ref={props.ref}
      kind="Primary"
      selectedFont={primaryFont}
      fontOptions={PrimaryFontOptions}
      updateFont={PreferenceSetters.setPrimaryFont}
    />
  );
}

/** Reusable font sheet component. */
function FontSheet<T extends AccentFont>(props: {
  ref: TrueSheetRef;
  kind: "Accent" | "Primary";
  selectedFont: T;
  fontOptions: readonly T[];
  updateFont: (newFont: T) => void;
}) {
  return (
    <Sheet
      ref={props.ref}
      titleKey={`feat.font.extra.${toLowerCase(props.kind)}`}
    >
      <FlatList
        accessibilityRole="radiogroup"
        data={props.fontOptions}
        keyExtractor={(font) => font}
        renderItem={({ item: font }) => (
          <Radio
            selected={props.selectedFont === font}
            onSelect={() => props.updateFont(font)}
          >
            <Text
              className="text-left text-base leading-tight text-foreground"
              style={{ fontFamily: getFont(font) }}
            >
              {font}
            </Text>
          </Radio>
        )}
        contentContainerClassName="gap-1"
      />
    </Sheet>
  );
}
//#endregion

//#region Theme
/** Enables changing the theme of the app. */
function ThemeSheet(props: { ref: TrueSheetRef }) {
  const selectedTheme = usePreferenceStore((s) => s.theme);

  return (
    <Sheet ref={props.ref} titleKey="feat.theme.title">
      <FlatList
        accessibilityRole="radiogroup"
        data={ThemeOptions}
        keyExtractor={(theme) => theme}
        renderItem={({ item: theme }) => (
          <Radio
            selected={selectedTheme === theme}
            onSelect={() => {
              Uniwind.setTheme(theme);
              PreferenceSetters.setTheme(theme);
            }}
          >
            <TStyledText textKey={`feat.theme.extra.${theme}`} />
          </Radio>
        )}
        contentContainerClassName="gap-1"
      />
    </Sheet>
  );
}
//#endregion

//#region Min Album Length
/**
 * Enables us to specify the minimum number of tracks required for an
 * album to be displayed in the Albums screen.
 */
function MinAlbumLengthSheet(props: { ref: TrueSheetRef }) {
  const minAlbumLength = usePreferenceStore((s) => s.minAlbumLength);
  return (
    <NumericSheet
      ref={props.ref}
      titleKey="feat.albumLengthFilter.title"
      descriptionKey="feat.albumLengthFilter.description"
      value={minAlbumLength}
      setValue={PreferenceSetters.setMinAlbumLength}
    />
  );
}
//#endregion

//#region Now Playing Design
/** Enables changing the appearance of the artwork on the "Now Playing" screen. */
function NowPlayingDesignSheet(props: { ref: TrueSheetRef }) {
  const nowPlayingDesign = usePreferenceStore((s) => s.nowPlayingDesign);
  return (
    <Sheet ref={props.ref} titleKey="feat.nowPlayingDesign.title">
      <FlatList
        accessibilityRole="radiogroup"
        data={NowPlayingDesignOptions}
        keyExtractor={(design) => design}
        renderItem={({ item: design }) => (
          <Radio
            selected={nowPlayingDesign === design}
            onSelect={() => PreferenceSetters.setNowPlayingDesign(design)}
          >
            <TStyledText textKey={`feat.nowPlayingDesign.extra.${design}`} />
          </Radio>
        )}
        contentContainerClassName="gap-1"
      />
    </Sheet>
  );
}
//#endregion
