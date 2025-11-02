import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { useUserPreferenceStore } from "~/stores/UserPreference/store";
import { PreferenceTogglers } from "~/stores/UserPreference/actions";
import { StandardScrollLayout } from "../../../layouts/StandardScroll";
import { AppearanceSettingsSheets } from "./Sheets";

import { List, ListItem } from "~/components/Containment/List";
import { useSheetRef } from "~/components/Sheet";

export default function AppearanceSettings() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const accentFont = useUserPreferenceStore((s) => s.accentFont);
  const primaryFont = useUserPreferenceStore((s) => s.primaryFont);
  const theme = useUserPreferenceStore((s) => s.theme);
  const minAlbumLength = useUserPreferenceStore((s) => s.minAlbumLength);
  const miniplayerGestures = useUserPreferenceStore(
    (s) => s.miniplayerGestures,
  );
  const nowPlayingDesign = useUserPreferenceStore((s) => s.nowPlayingDesign);
  const ignoreRTLLayout = useUserPreferenceStore((s) => s.ignoreRTLLayout);
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
            onPress={PreferenceTogglers.toggleMiniplayerGestures}
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
          onPress={PreferenceTogglers.toggleIgnoreRTLLayout}
          switchState={ignoreRTLLayout}
          first
          last
        />
      </StandardScrollLayout>
    </>
  );
}
