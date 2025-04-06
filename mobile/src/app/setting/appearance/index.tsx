import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { StandardScrollLayout } from "~/layouts/StandardScroll";
import { AppearanceSettingsSheets } from "~/screens/Sheets/Settings/Appearance";

import { List, ListItem } from "~/components/Containment/List";
import { useSheetRef } from "~/components/Sheet";

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
  const accentFontSheetRef = useSheetRef();
  const primaryFontSheetRef = useSheetRef();
  const themeSheetRef = useSheetRef();
  const nowPlayingDesignSheetRef = useSheetRef();

  return (
    <>
      <AppearanceSettingsSheets
        accentFontRef={accentFontSheetRef}
        primaryFontRef={primaryFontSheetRef}
        themeRef={themeSheetRef}
        nowPlayingDesignRef={nowPlayingDesignSheetRef}
      />
      <StandardScrollLayout>
        <List>
          <ListItem
            titleKey="feat.font.extra.accent"
            description={accentFont}
            onPress={() => accentFontSheetRef.current?.present()}
            first
          />
          <ListItem
            titleKey="feat.font.extra.primary"
            description={primaryFont}
            onPress={() => primaryFontSheetRef.current?.present()}
          />
          <ListItem
            titleKey="feat.theme.title"
            description={t(`feat.theme.extra.${theme}`)}
            onPress={() => themeSheetRef.current?.present()}
            last
          />
        </List>

        <List>
          <ListItem
            titleKey="feat.homeTabsOrder.title"
            description={t("feat.homeTabsOrder.brief")}
            onPress={() =>
              router.navigate("/setting/appearance/home-tabs-order")
            }
            first
          />
          <ListItem
            titleKey="feat.nowPlayingDesign.title"
            description={t(`feat.nowPlayingDesign.extra.${nowPlayingDesign}`)}
            onPress={() => nowPlayingDesignSheetRef.current?.present()}
          />
          <ListItem
            titleKey="feat.playedRecent.extra.section"
            onPress={toggleShowRecent}
            switchState={showRecentlyPlayed}
            last
          />
        </List>
      </StandardScrollLayout>
    </>
  );
}

const toggleShowRecent = () =>
  userPreferencesStore.setState((prev) => ({ showRecent: !prev.showRecent }));
