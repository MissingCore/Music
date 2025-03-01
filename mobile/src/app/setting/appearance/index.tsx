import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { SheetManager } from "react-native-actions-sheet";

import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { StandardScrollLayout } from "~/layouts/StandardScroll";

import { List, ListItem } from "~/components/Containment/List";

/** Screen for `/setting/appearance` route. */
export default function AppearanceScreen() {
  const { t } = useTranslation();
  const accentFont = useUserPreferencesStore((state) => state.accentFont);
  const primaryFont = useUserPreferencesStore((state) => state.primaryFont);
  const theme = useUserPreferencesStore((state) => state.theme);
  const nowPlayingDesign = useUserPreferencesStore(
    (state) => state.nowPlayingDesign,
  );
  const showRecentlyPlayed = useUserPreferencesStore(
    (state) => state.showRecent,
  );

  return (
    <StandardScrollLayout>
      <List>
        <ListItem
          titleKey="feat.font.extra.accent"
          description={accentFont}
          onPress={() => SheetManager.show("FontAccentSheet")}
          first
        />
        <ListItem
          titleKey="feat.font.extra.primary"
          description={primaryFont}
          onPress={() => SheetManager.show("FontPrimarySheet")}
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
        />
        <ListItem
          titleKey="feat.playedRecent.extra.section"
          onPress={toggleShowRecent}
          switchState={showRecentlyPlayed}
          last
        />
      </List>
    </StandardScrollLayout>
  );
}

const toggleShowRecent = () =>
  userPreferencesStore.setState((prev) => ({ showRecent: !prev.showRecent }));
