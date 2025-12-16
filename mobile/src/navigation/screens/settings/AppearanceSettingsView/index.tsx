import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { StandardScrollLayout } from "~/navigation/layouts/StandardScroll";
import {
  AccentFontSheet,
  PrimaryFontSheet,
} from "~/navigation/sheets/FontSheet";
import { AppearanceSettingsSheets } from "./Sheets";

import { List, ListItem } from "~/components/Containment/List";
import { useSheetRef } from "~/components/Sheet";

export default function AppearanceSettings() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const accentFont = usePreferenceStore((s) => s.accentFont);
  const primaryFont = usePreferenceStore((s) => s.primaryFont);
  const theme = usePreferenceStore((s) => s.theme);
  const minAlbumLength = usePreferenceStore((s) => s.minAlbumLength);
  const miniplayerGestures = usePreferenceStore((s) => s.miniplayerGestures);
  const nowPlayingDesign = usePreferenceStore((s) => s.nowPlayingDesign);
  const quickScroll = usePreferenceStore((s) => s.quickScroll);
  const accentFontSheetRef = useSheetRef();
  const primaryFontSheetRef = useSheetRef();
  const themeSheetRef = useSheetRef();
  const albumLengthFilterSheetRef = useSheetRef();
  const nowPlayingDesignSheetRef = useSheetRef();

  return (
    <>
      <AccentFontSheet ref={accentFontSheetRef} />
      <PrimaryFontSheet ref={primaryFontSheetRef} />
      <AppearanceSettingsSheets
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
          />
          <ListItem
            titleKey="feat.quickScroll.title"
            description={t("feat.quickScroll.brief")}
            onPress={PreferenceTogglers.toggleQuickScroll}
            switchState={quickScroll}
            last
          />
        </List>
      </StandardScrollLayout>
    </>
  );
}
