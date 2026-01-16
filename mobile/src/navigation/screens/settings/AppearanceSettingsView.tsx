import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import { AccentFontSheet, PrimaryFontSheet } from "./sheets/FontSheet";
import { MinAlbumLengthSheet } from "./sheets/MinAlbumLengthSheet";
import { NowPlayingDesignSheet } from "./sheets/NowPlayingDesignSheet";
import { TabOrderSheet } from "./sheets/TabOrderSheet";
import { ThemeSheet } from "./sheets/ThemeSheet";

import { SegmentedList } from "~/components/List/Segmented";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { Switch } from "~/components/UI/Switch";

export default function AppearanceSettings() {
  const { t } = useTranslation();
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
  const tabOrderSheetRef = useSheetRef();
  const minAlbumLengthSheetRef = useSheetRef();
  const nowPlayingDesignSheetRef = useSheetRef();

  return (
    <>
      <AccentFontSheet ref={accentFontSheetRef} />
      <PrimaryFontSheet ref={primaryFontSheetRef} />
      <ThemeSheet ref={themeSheetRef} />
      <TabOrderSheet ref={tabOrderSheetRef} />
      <MinAlbumLengthSheet ref={minAlbumLengthSheetRef} />
      <NowPlayingDesignSheet ref={nowPlayingDesignSheetRef} />

      <ListLayout>
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
          onPress={() => tabOrderSheetRef.current?.present()}
        />

        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.minAlbumLength.title"
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
      </ListLayout>
    </>
  );
}
