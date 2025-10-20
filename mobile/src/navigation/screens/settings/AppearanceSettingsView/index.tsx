import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { I18nManager } from "react-native";

import i18next from "~/modules/i18n";
import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { StandardScrollLayout } from "../../../layouts/StandardScroll";
import { AppearanceSettingsSheets } from "./Sheets";

import { List, ListItem } from "~/components/Containment/List";
import { useSheetRef } from "~/components/Sheet";

export default function AppearanceSettings() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const accentFont = useUserPreferencesStore((s) => s.accentFont);
  const primaryFont = useUserPreferencesStore((s) => s.primaryFont);
  const theme = useUserPreferencesStore((s) => s.theme);
  const minAlbumLength = useUserPreferencesStore((s) => s.minAlbumLength);
  const miniplayerGestures = useUserPreferencesStore(
    (s) => s.miniplayerGestures,
  );
  const nowPlayingDesign = useUserPreferencesStore((s) => s.nowPlayingDesign);
  const ignoreRTLLayout = useUserPreferencesStore((s) => s.ignoreRTLLayout);
  const accentFontSheetRef = useSheetRef();
  const primaryFontSheetRef = useSheetRef();
  const themeSheetRef = useSheetRef();
  const albumLengthFilterSheetRef = useSheetRef();
  const nowPlayingDesignSheetRef = useSheetRef();

  return (
    <>
      <AppearanceSettingsSheets
        accentFontRef={accentFontSheetRef}
        primaryFontRef={primaryFontSheetRef}
        themeRef={themeSheetRef}
        albumLengthFilterRef={albumLengthFilterSheetRef}
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

        <ListItem
          titleKey="feat.tabsOrder.title"
          description={t("feat.tabsOrder.brief")}
          onPress={() => navigation.navigate("HomeTabsOrderSettings")}
          first
          last
        />

        <List>
          <ListItem
            titleKey="feat.albumLengthFilter.title"
            description={t("plural.track", { count: minAlbumLength })}
            onPress={() => albumLengthFilterSheetRef.current?.present()}
            first
          />
          <ListItem
            titleKey="feat.miniplayerGestures.title"
            onPress={toggleMiniplayerGestures}
            switchState={miniplayerGestures}
          />
          <ListItem
            titleKey="feat.nowPlayingDesign.title"
            description={t(`feat.nowPlayingDesign.extra.${nowPlayingDesign}`)}
            onPress={() => nowPlayingDesignSheetRef.current?.present()}
            last
          />
        </List>

        <ListItem
          titleKey="feat.ignoreRTLLayout.title"
          description={t("feat.ignoreRTLLayout.brief")}
          onPress={toggleIgnoreRTLLayout}
          switchState={ignoreRTLLayout}
          first
          last
        />
      </StandardScrollLayout>
    </>
  );
}

const toggleMiniplayerGestures = () =>
  userPreferencesStore.setState((prev) => ({
    miniplayerGestures: !prev.miniplayerGestures,
  }));

const toggleIgnoreRTLLayout = () => {
  const nextState = !userPreferencesStore.getState().ignoreRTLLayout;
  userPreferencesStore.setState({ ignoreRTLLayout: nextState });
  I18nManager.allowRTL(nextState ? false : i18next.dir() === "rtl");
  I18nManager.forceRTL(nextState ? false : i18next.dir() === "rtl");
};
