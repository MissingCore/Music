import { useColorScheme } from "nativewind";

import {
  ThemeOptions,
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";

import { FlatList } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import { Sheet } from "~/components/Sheet";
import { TStyledText } from "~/components/Typography/StyledText";

/** Sheet allowing us to change the app's theme. */
export default function ThemeSheet() {
  const { setColorScheme } = useColorScheme();
  const theme = useUserPreferencesStore((state) => state.theme);

  return (
    <Sheet id="ThemeSheet" titleKey="feat.theme.title">
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

const setTheme = (newTheme: (typeof ThemeOptions)[number]) =>
  userPreferencesStore.setState({ theme: newTheme });
