import type { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useColorScheme } from "nativewind";
import type { RefObject } from "react";
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
import { Sheet } from "~/components/Sheet";
import { TStyledText } from "~/components/Typography/StyledText";

/** All the sheets used on `/setting/appearance` route. */
export function AppearanceSettingsSheets(
  props: Record<
    "accentFontRef" | "primaryFontRef" | "themeRef" | "nowPlayingDesignRef",
    RefObject<TrueSheet>
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
}

//#region Font
/** Enables changing the font used primarily for headings. */
function FontAccentSheet(props: { sheetRef: RefObject<TrueSheet> }) {
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
function FontPrimarySheet(props: { sheetRef: RefObject<TrueSheet> }) {
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
  sheetRef: RefObject<TrueSheet>;
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
              className="text-base leading-tight text-foreground"
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

/** Enables changing the theme of the app. */
function ThemeSheet(props: { sheetRef: RefObject<TrueSheet> }) {
  const { setColorScheme } = useColorScheme();
  const theme = useUserPreferencesStore((state) => state.theme);

  return (
    <Sheet ref={props.sheetRef} titleKey="feat.theme.title">
      <FlatList
        accessibilityRole="radiogroup"
        data={ThemeOptions}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Radio
            selected={item === theme}
            onSelect={() => {
              setColorScheme(item);
              setTheme(item);
            }}
          >
            <TStyledText textKey={`feat.theme.extra.${item}`} />
          </Radio>
        )}
        contentContainerClassName="gap-1"
      />
    </Sheet>
  );
}

/** Enables changing the appearance of the artwork on the "Now Playing" screen. */
function NowPlayingDesignSheet(props: { sheetRef: RefObject<TrueSheet> }) {
  const nowPlayingDesign = useUserPreferencesStore(
    (state) => state.nowPlayingDesign,
  );
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
