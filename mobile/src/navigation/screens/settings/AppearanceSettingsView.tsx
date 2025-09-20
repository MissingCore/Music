import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { I18nManager } from "react-native";

import i18next from "~/modules/i18n";
import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { StandardScrollLayout } from "../../layouts/StandardScroll";
import { AppearanceSettingsSheets } from "./AppearanceSettingsSheets";

import { List, ListItem } from "~/components/Containment/List";
import { useSheetRef } from "~/components/Sheet";

export default function AppearanceSettings() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const accentFont = useUserPreferencesStore((state) => state.accentFont);
  const primaryFont = useUserPreferencesStore((state) => state.primaryFont);
  const theme = useUserPreferencesStore((state) => state.theme);
  const nowPlayingDesign = useUserPreferencesStore(
    (state) => state.nowPlayingDesign,
  );
  const showVisualTips = useUserPreferencesStore((state) => state.visualTips);
  const ignoreRTLLayout = useUserPreferencesStore(
    (state) => state.ignoreRTLLayout,
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
            onPress={() => navigation.navigate("HomeTabsOrderSettings")}
            first
          />
          <ListItem
            titleKey="feat.nowPlayingDesign.title"
            description={t(`feat.nowPlayingDesign.extra.${nowPlayingDesign}`)}
            onPress={() => nowPlayingDesignSheetRef.current?.present()}
            last
          />
        </List>

        <List>
          <ListItem
            titleKey="feat.ignoreRTLLayout.title"
            description={t("feat.ignoreRTLLayout.brief")}
            onPress={toggleIgnoreRTLLayout}
            switchState={ignoreRTLLayout}
            first
          />
          <ListItem
            titleKey="feat.visualTips.title"
            onPress={toggleVisualTips}
            switchState={showVisualTips}
            last
          />
        </List>
      </StandardScrollLayout>
    </>
  );
}

const toggleVisualTips = () =>
  userPreferencesStore.setState((prev) => ({ visualTips: !prev.visualTips }));

const toggleIgnoreRTLLayout = () => {
  const nextState = !userPreferencesStore.getState().ignoreRTLLayout;
  userPreferencesStore.setState({ ignoreRTLLayout: nextState });
  I18nManager.allowRTL(nextState ? false : i18next.dir() === "rtl");
  I18nManager.forceRTL(nextState ? false : i18next.dir() === "rtl");
};
