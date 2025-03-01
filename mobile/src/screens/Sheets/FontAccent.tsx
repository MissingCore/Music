import { Text } from "react-native";

import {
  AccentFontOptions,
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";

import { getFont } from "~/lib/style";
import { SheetsFlatList } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import { Sheet } from "~/components/Sheet";

/** Sheet allowing us to change the app's accent font. */
export default function FontAccentSheet() {
  const accentFont = useUserPreferencesStore((state) => state.accentFont);
  return (
    <Sheet
      id="FontAccentSheet"
      titleKey="feat.font.extra.accent"
      contentContainerClassName="pb-0"
    >
      <SheetsFlatList
        accessibilityRole="radiogroup"
        data={AccentFontOptions}
        keyExtractor={(font) => font}
        renderItem={({ item: font }) => (
          <Radio
            selected={accentFont === font}
            onSelect={() => setAccentFont(font)}
          >
            <Text
              className="text-base leading-tight text-foreground"
              style={{ fontFamily: getFont(font) }}
            >
              {font}
            </Text>
          </Radio>
        )}
        contentContainerClassName="gap-1 pb-4"
      />
    </Sheet>
  );
}

const setAccentFont = (newFont: (typeof AccentFontOptions)[number]) =>
  userPreferencesStore.setState({ accentFont: newFont });
