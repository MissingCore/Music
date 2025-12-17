import { useColorScheme } from "nativewind";
import { Text } from "react-native";

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
        <FontAccentSheet sheetRef={props.accentFontRef} />
        <FontPrimarySheet sheetRef={props.primaryFontRef} />
        <ThemeSheet sheetRef={props.themeRef} />
        <MinAlbumLengthSheet sheetRef={props.albumLengthFilterRef} />
        <NowPlayingDesignSheet sheetRef={props.nowPlayingDesignRef} />
      </>
    );
  },
);

//#region Font
/** Enables changing the font used primarily for headings. */
function FontAccentSheet(props: { sheetRef: TrueSheetRef }) {
  const accentFont = usePreferenceStore((s) => s.accentFont);
  return (
    <FontSheet
      sheetRef={props.sheetRef}
      kind="Accent"
      selectedFont={accentFont}
      fontOptions={AccentFontOptions}
      updateFont={PreferenceSetters.setAccentFont}
    />
  );
}

/** Enables changing the font used by all text in the app. */
function FontPrimarySheet(props: { sheetRef: TrueSheetRef }) {
  const primaryFont = usePreferenceStore((s) => s.primaryFont);
  return (
    <FontSheet
      sheetRef={props.sheetRef}
      kind="Primary"
      selectedFont={primaryFont}
      fontOptions={PrimaryFontOptions}
      updateFont={PreferenceSetters.setPrimaryFont}
    />
  );
}

/** Reusable font sheet component. */
function FontSheet<T extends AccentFont>(props: {
  sheetRef: TrueSheetRef;
  kind: "Accent" | "Primary";
  selectedFont: T;
  fontOptions: readonly T[];
  updateFont: (newFont: T) => void;
}) {
  return (
    <Sheet
      ref={props.sheetRef}
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
function ThemeSheet(props: { sheetRef: TrueSheetRef }) {
  const { setColorScheme } = useColorScheme();
  const selectedTheme = usePreferenceStore((s) => s.theme);

  return (
    <Sheet ref={props.sheetRef} titleKey="feat.theme.title">
      <FlatList
        accessibilityRole="radiogroup"
        data={ThemeOptions}
        keyExtractor={(theme) => theme}
        renderItem={({ item: theme }) => (
          <Radio
            selected={selectedTheme === theme}
            onSelect={() => {
              setColorScheme(theme);
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
function MinAlbumLengthSheet(props: { sheetRef: TrueSheetRef }) {
  const minAlbumLength = usePreferenceStore((s) => s.minAlbumLength);
  return (
    <NumericSheet
      sheetRef={props.sheetRef}
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
function NowPlayingDesignSheet(props: { sheetRef: TrueSheetRef }) {
  const nowPlayingDesign = usePreferenceStore((s) => s.nowPlayingDesign);
  return (
    <Sheet ref={props.sheetRef} titleKey="feat.nowPlayingDesign.title">
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
