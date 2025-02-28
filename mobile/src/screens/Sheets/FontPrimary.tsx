import { Text } from "react-native";

import {
  PrimaryFontOptions,
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";

import { getFont } from "~/lib/style";
import { SheetsFlatList } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import { Sheet } from "~/components/Sheet";

/** Sheet allowing us to change the app's primary font. */
export default function FontPrimarySheet() {
  const primaryFont = useUserPreferencesStore((state) => state.primaryFont);
  return (
    <Sheet
      id="FontPrimarySheet"
      titleKey="feat.font.extra.primary"
      contentContainerClassName="pb-0"
    >
      <SheetsFlatList
        accessibilityRole="radiogroup"
        data={PrimaryFontOptions}
        keyExtractor={(font) => font}
        renderItem={({ item: font }) => (
          <Radio
            selected={primaryFont === font}
            onSelect={() => setPrimaryFont(font)}
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

const setPrimaryFont = (newFont: (typeof PrimaryFontOptions)[number]) =>
  userPreferencesStore.setState({ primaryFont: newFont });
