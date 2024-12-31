import { useTranslation } from "react-i18next";
import { SheetManager } from "react-native-actions-sheet";

import { useUserPreferencesStore } from "@/services/UserPreferences";
import { StandardScrollLayout } from "@/layouts/StandardScroll";

import { List, ListItem } from "@/components/Containment/List";

/** Screen for `/setting/appearance` route. */
export default function AppearanceScreen() {
  const { t } = useTranslation();
  const accentFont = useUserPreferencesStore((state) => state.accentFont);
  const theme = useUserPreferencesStore((state) => state.theme);

  return (
    <StandardScrollLayout>
      <List>
        <ListItem
          titleKey="title.font"
          description={accentFont}
          onPress={() => SheetManager.show("FontSheet")}
          first
        />
        <ListItem
          titleKey="title.theme"
          description={t(`settings.related.${theme}`)}
          onPress={() => SheetManager.show("ThemeSheet")}
          last
        />
      </List>
    </StandardScrollLayout>
  );
}
