import { useTranslation } from "react-i18next";
import { SheetManager } from "react-native-actions-sheet";

import { useUserPreferencesStore } from "@/services/UserPreferences";
import { StandardScrollLayout } from "@/layouts";

import { List, ListItem } from "@/components/Containment";

/** Screen for `/setting/appearance` route. */
export default function AppearanceScreen() {
  const { t } = useTranslation();
  const accentFont = useUserPreferencesStore((state) => state.accentFont);
  const theme = useUserPreferencesStore((state) => state.theme);

  return (
    <StandardScrollLayout>
      <List>
        <ListItem
          title={t("title.font")}
          description={accentFont}
          onPress={() => SheetManager.show("font-sheet")}
          first
        />
        <ListItem
          title={t("title.theme")}
          description={t(`settings.related.${theme}`)}
          onPress={() => SheetManager.show("theme-sheet")}
          last
        />
      </List>
    </StandardScrollLayout>
  );
}
