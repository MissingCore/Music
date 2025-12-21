import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { StandardScrollLayout } from "~/navigation/layouts/StandardScroll";
import {
  AccentFontSheet,
  PrimaryFontSheet,
} from "~/navigation/sheets/FontSheet";
import { MinAlbumLengthSheet } from "~/navigation/sheets/MinAlbumLengthSheet";
import { NowPlayingDesignSheet } from "~/navigation/sheets/NowPlayingDesignSheet";
import { ThemeSheet } from "~/navigation/sheets/ThemeSheet";

import { Switch } from "~/components/Form/Switch";
import { SegmentedList } from "~/components/List/Segmented";
import { useSheetRef } from "~/components/Sheet/useSheetRef";

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
  const minAlbumLengthSheetRef = useSheetRef();
  const nowPlayingDesignSheetRef = useSheetRef();

  return (
    <>
      <AccentFontSheet ref={accentFontSheetRef} />
      <PrimaryFontSheet ref={primaryFontSheetRef} />
      <ThemeSheet ref={themeSheetRef} />
      <MinAlbumLengthSheet ref={minAlbumLengthSheetRef} />
      <NowPlayingDesignSheet ref={nowPlayingDesignSheetRef} />

      <StandardScrollLayout>
        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.font.extra.accent"
            supportingText={accentFont}
            onPress={() => accentFontSheetRef.current?.present()}
          />
          <SegmentedList.Item
            labelTextKey="feat.font.extra.primary"
            supportingText={primaryFont}
            onPress={() => primaryFontSheetRef.current?.present()}
          />
          <SegmentedList.Item
            labelTextKey="feat.theme.title"
            supportingText={t(`feat.theme.extra.${theme}`)}
            onPress={() => themeSheetRef.current?.present()}
          />
        </SegmentedList>

        <SegmentedList.Item
          labelTextKey="feat.tabsOrder.title"
          supportingText={t("feat.tabsOrder.brief")}
          onPress={() => navigation.navigate("HomeTabsOrderSettings")}
        />

        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.albumLengthFilter.title"
            supportingText={t("plural.track", { count: minAlbumLength })}
            onPress={() => minAlbumLengthSheetRef.current?.present()}
          />
          <SegmentedList.Item
            labelTextKey="feat.miniplayerGestures.title"
            onPress={PreferenceTogglers.toggleMiniplayerGestures}
            RightElement={<Switch enabled={miniplayerGestures} />}
          />
          <SegmentedList.Item
            labelTextKey="feat.nowPlayingDesign.title"
            supportingText={t(
              `feat.nowPlayingDesign.extra.${nowPlayingDesign}`,
            )}
            onPress={() => nowPlayingDesignSheetRef.current?.present()}
          />
          <SegmentedList.Item
            labelTextKey="feat.quickScroll.title"
            supportingText={t("feat.quickScroll.brief")}
            onPress={PreferenceTogglers.toggleQuickScroll}
            RightElement={<Switch enabled={quickScroll} />}
          />
        </SegmentedList>
      </StandardScrollLayout>
    </>
  );
}
