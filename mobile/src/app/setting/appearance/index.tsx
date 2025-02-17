import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { SheetManager } from "react-native-actions-sheet";

import { useUserPreferencesStore } from "~/services/UserPreferences";
import { StandardScrollLayout } from "~/layouts/StandardScroll";

import { List, ListItem } from "~/components/Containment/List";

/** Screen for `/setting/appearance` route. */
export default function AppearanceScreen() {
  const { t } = useTranslation();
  const accentFont = useUserPreferencesStore((state) => state.accentFont);
  const theme = useUserPreferencesStore((state) => state.theme);
  const nowPlayingDesign = useUserPreferencesStore(
    (state) => state.nowPlayingDesign,
  );

  return (
    <StandardScrollLayout>
      <List>
        <ListItem
          titleKey="feat.accentFont.title"
          description={accentFont}
          onPress={() => SheetManager.show("FontSheet")}
          first
        />
        <ListItem
          titleKey="feat.theme.title"
          description={t(`feat.theme.extra.${theme}`)}
          onPress={() => SheetManager.show("ThemeSheet")}
          last
        />
      </List>

      <List>
        <ListItem
          titleKey="feat.homeTabsOrder.title"
          description={t("feat.homeTabsOrder.brief")}
          onPress={() => router.navigate("/setting/appearance/home-tabs-order")}
          first
        />
        <ListItem
          titleKey="feat.nowPlayingDesign.title"
          description={t(`feat.nowPlayingDesign.extra.${nowPlayingDesign}`)}
          onPress={() => SheetManager.show("NowPlayingDesignSheet")}
          last
        />
      </List>
    </StandardScrollLayout>
  );
}
