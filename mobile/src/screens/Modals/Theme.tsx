import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import type { SheetProps } from "react-native-actions-sheet";

import {
  ThemeOptions,
  useUserPreferencesStore,
} from "@/services/UserPreferences";

import { Radio } from "@/components/new/Form";
import { Sheet } from "@/components/new/Sheet";
import { StyledText } from "@/components/new/Typography";

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
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-1"
      />
    </Sheet>
  );
}
