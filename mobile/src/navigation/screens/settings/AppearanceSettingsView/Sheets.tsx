import { useColorScheme } from "nativewind";
import { Text } from "react-native";

import {
  AccentFontOptions,
  NowPlayingDesignOptions,
  PrimaryFontOptions,
  ThemeOptions,
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";

import { getFont } from "~/lib/style";
import { toLowerCase } from "~/utils/string";
import { FlatList } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import type { TrueSheetRef } from "~/components/Sheet";
import { NumericSheet, Sheet } from "~/components/Sheet";
import { TStyledText } from "~/components/Typography/StyledText";
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
  const accentFont = useUserPreferencesStore((s) => s.accentFont);
  return (
    <FontSheet
      sheetRef={props.sheetRef}
      kind="Accent"
      selectedFont={accentFont}
      fontOptions={AccentFontOptions}
      updateFont={setAccentFont}
    />
  );
}

/** Enables changing the font used by all text in the app. */
function FontPrimarySheet(props: { sheetRef: TrueSheetRef }) {
  const primaryFont = useUserPreferencesStore((s) => s.primaryFont);
  return (
    <FontSheet
      sheetRef={props.sheetRef}
      kind="Primary"
      selectedFont={primaryFont}
      fontOptions={PrimaryFontOptions}
      updateFont={setPrimaryFont}
    />
  );
}

/** Reusable font sheet component. */
function FontSheet<T extends (typeof AccentFontOptions)[number]>(props: {
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
  const selectedTheme = useUserPreferencesStore((s) => s.theme);

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
              setTheme(theme);
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
  const minAlbumLength = useUserPreferencesStore((s) => s.minAlbumLength);
  return (
    <NumericSheet
      sheetRef={props.sheetRef}
      titleKey="feat.albumLengthFilter.title"
      descriptionKey="feat.albumLengthFilter.description"
      value={minAlbumLength}
      setValue={setMinAlbumLength}
    />
  );
}
//#endregion

//#region Now Playing Design
/** Enables changing the appearance of the artwork on the "Now Playing" screen. */
function NowPlayingDesignSheet(props: { sheetRef: TrueSheetRef }) {
  const nowPlayingDesign = useUserPreferencesStore((s) => s.nowPlayingDesign);
  return (
    <Sheet ref={props.sheetRef} titleKey="feat.nowPlayingDesign.title">
      <FlatList
        accessibilityRole="radiogroup"
        data={NowPlayingDesignOptions}
        keyExtractor={(design) => design}
        renderItem={({ item: design }) => (
          <Radio
            selected={nowPlayingDesign === design}
            onSelect={() => setNowPlayingDesign(design)}
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

//#region Setter Functions
const setAccentFont = (newFont: (typeof AccentFontOptions)[number]) =>
  userPreferencesStore.setState({ accentFont: newFont });

const setPrimaryFont = (newFont: (typeof PrimaryFontOptions)[number]) =>
  userPreferencesStore.setState({ primaryFont: newFont });

const setTheme = (newTheme: (typeof ThemeOptions)[number]) =>
  userPreferencesStore.setState({ theme: newTheme });

const setNowPlayingDesign = (
  newDesign: (typeof NowPlayingDesignOptions)[number],
) => userPreferencesStore.setState({ nowPlayingDesign: newDesign });

const setMinAlbumLength = (newLength: number) =>
  userPreferencesStore.setState({ minAlbumLength: newLength });
//#endregion
