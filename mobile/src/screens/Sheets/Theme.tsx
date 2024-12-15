import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import type { SheetProps } from "react-native-actions-sheet";

import {
  ThemeOptions,
  useUserPreferencesStore,
} from "@/services/UserPreferences";

import { FlatList } from "@/components/Defaults";
import { Radio } from "@/components/Form";
import { Sheet } from "@/components/Sheet";
import { StyledText } from "@/components/Typography";

/** Sheet allowing us to change the app's theme. */
export default function ThemeSheet(props: SheetProps<"theme-sheet">) {
  const { t } = useTranslation();
  const { setColorScheme } = useColorScheme();
  const theme = useUserPreferencesStore((state) => state.theme);
  const setTheme = useUserPreferencesStore((state) => state.setTheme);

  return (
    <Sheet id={props.sheetId} title={t("title.theme")}>
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
            <StyledText>{t(`settings.related.${item}`)}</StyledText>
          </Radio>
        )}
        contentContainerClassName="gap-1"
      />
    </Sheet>
  );
}
