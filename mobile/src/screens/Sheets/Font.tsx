import { Text } from "react-native";

import {
  FontOptions,
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";

import { getAccentFont } from "~/lib/style";
import { SheetsFlatList } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import { Sheet } from "~/components/Sheet";

/** Sheet allowing us to change the app's accent font. */
export default function FontSheet() {
  const accentFont = useUserPreferencesStore((state) => state.accentFont);
  return (
    <Sheet
      id="FontSheet"
      titleKey="feat.accentFont.title"
      contentContainerClassName="pb-0"
    >
      <SheetsFlatList
        accessibilityRole="radiogroup"
        data={FontOptions}
        keyExtractor={(font) => font}
        renderItem={({ item: font }) => (
          <Radio
            selected={accentFont === font}
            onSelect={() => setAccentFont(font)}
          >
            <Text
              className="text-base leading-tight text-foreground"
              style={{ fontFamily: getAccentFont(font) }}
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

const setAccentFont = (newFont: (typeof FontOptions)[number]) =>
  userPreferencesStore.setState({ accentFont: newFont });
