import { useColorScheme } from "nativewind";

import {
  ThemeOptions,
  useUserPreferencesStore,
} from "@/services/UserPreferences";

import { FlatList } from "@/components/Defaults";
import { Radio } from "@/components/Form/Selection";
import { Sheet } from "@/components/Sheet";
import { TStyledText } from "@/components/Typography";

/** Sheet allowing us to change the app's theme. */
export default function ThemeSheet() {
  const { setColorScheme } = useColorScheme();
  const theme = useUserPreferencesStore((state) => state.theme);
  const setTheme = useUserPreferencesStore((state) => state.setTheme);

  return (
    <Sheet id="ThemeSheet" titleKey="title.theme">
      <FlatList
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
            <TStyledText textKey={`settings.related.${item}`} />
          </Radio>
        )}
        contentContainerClassName="gap-1"
      />
    </Sheet>
  );
}
