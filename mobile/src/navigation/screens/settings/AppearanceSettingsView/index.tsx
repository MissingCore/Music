import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";
import { StandardScrollLayout } from "../../../layouts/StandardScroll";
import { AppearanceSettingsSheets } from "./Sheets";

import { SegmentedList } from "~/components/List/Segmented";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { Switch } from "~/components/UI/Switch";

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
  const forceLTR = usePreferenceStore((s) => s.forceLTR);
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
            onPress={() => albumLengthFilterSheetRef.current?.present()}
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

        <SegmentedList.Item
          labelTextKey="feat.ignoreRTLLayout.title"
          supportingText={t("feat.ignoreRTLLayout.brief")}
          onPress={PreferenceTogglers.toggleForceLTR}
          RightElement={<Switch enabled={forceLTR} />}
        />
      </StandardScrollLayout>
    </>
  );
}
