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

import { deferInitialRender } from "~/lib/react";
import { getFont } from "~/lib/style";
import { toLowerCase } from "~/utils/string";
import { LegendList } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import type { TrueSheetRef } from "~/components/Sheet";
import { Sheet } from "~/components/Sheet";
import { TStyledText } from "~/components/Typography/StyledText";

/** All the sheets used on `/setting/appearance` route. */
export const AppearanceSettingsSheets = deferInitialRender(
  function AppearanceSettingsSheets(
    props: Record<
      "accentFontRef" | "primaryFontRef" | "themeRef" | "nowPlayingDesignRef",
      TrueSheetRef
    >,
  ) {
    return (
      <>
        <FontAccentSheet sheetRef={props.accentFontRef} />
        <FontPrimarySheet sheetRef={props.primaryFontRef} />
        <ThemeSheet sheetRef={props.themeRef} />
        <NowPlayingDesignSheet sheetRef={props.nowPlayingDesignRef} />
      </>
    );
  },
);

//#region Font
/** Enables changing the font used primarily for headings. */
function FontAccentSheet(props: { sheetRef: TrueSheetRef }) {
  const accentFont = useUserPreferencesStore((state) => state.accentFont);
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
  const primaryFont = useUserPreferencesStore((state) => state.primaryFont);
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
      <LegendList
        accessibilityRole="radiogroup"
        estimatedItemSize={54}
        data={props.fontOptions}
        keyExtractor={(font) => font}
        extraData={props.selectedFont}
        renderItem={({ item: font }) => (
          <Radio
            selected={props.selectedFont === font}
            onSelect={() => props.updateFont(font)}
          >
            <Text
              className="text-base leading-tight text-foreground"
              style={{ fontFamily: getFont(font) }}
            >
              {font}
            </Text>
          </Radio>
        )}
        columnWrapperStyle={{ rowGap: 4 }}
      />
    </Sheet>
  );
}
//#endregion

/** Enables changing the theme of the app. */
function ThemeSheet(props: { sheetRef: TrueSheetRef }) {
  const { setColorScheme } = useColorScheme();
  const selectedTheme = useUserPreferencesStore((state) => state.theme);

  return (
    <Sheet ref={props.sheetRef} titleKey="feat.theme.title">
      <LegendList
        accessibilityRole="radiogroup"
        estimatedItemSize={54}
        data={ThemeOptions}
        keyExtractor={(theme) => theme}
        extraData={selectedTheme}
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
        columnWrapperStyle={{ rowGap: 4 }}
      />
    </Sheet>
  );
}

/** Enables changing the appearance of the artwork on the "Now Playing" screen. */
function NowPlayingDesignSheet(props: { sheetRef: TrueSheetRef }) {
  const nowPlayingDesign = useUserPreferencesStore(
    (state) => state.nowPlayingDesign,
  );
  return (
    <Sheet ref={props.sheetRef} titleKey="feat.nowPlayingDesign.title">
      <LegendList
        accessibilityRole="radiogroup"
        estimatedItemSize={54}
        data={NowPlayingDesignOptions}
        keyExtractor={(design) => design}
        extraData={nowPlayingDesign}
        renderItem={({ item: design }) => (
          <Radio
            selected={nowPlayingDesign === design}
            onSelect={() => setNowPlayingDesign(design)}
          >
            <TStyledText textKey={`feat.nowPlayingDesign.extra.${design}`} />
          </Radio>
        )}
        columnWrapperStyle={{ rowGap: 4 }}
      />
    </Sheet>
  );
}

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
//#endregion
