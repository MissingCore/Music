import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import { AccentFontSheet, PrimaryFontSheet } from "./sheets/FontSheet";
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
  const activeCustomTheme = usePreferenceStore((s) => s.activeCustomTheme);
  const quickScroll = usePreferenceStore((s) => s.quickScroll);
  const squareArtwork = usePreferenceStore((s) => s.squareArtwork);
  const accentFontSheetRef = useSheetRef();
  const primaryFontSheetRef = useSheetRef();
  const themeSheetRef = useSheetRef();
  const tabOrderSheetRef = useSheetRef();

  return (
    <>
      <AccentFontSheet ref={accentFontSheetRef} />
      <PrimaryFontSheet ref={primaryFontSheetRef} />
      <ThemeSheet ref={themeSheetRef} />
      <TabOrderSheet ref={tabOrderSheetRef} />

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
            supportingText={
              activeCustomTheme?.name ?? t(`feat.theme.extra.${theme}`)
            }
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
            labelTextKey="feat.quickScroll.title"
            supportingText={t("feat.quickScroll.brief")}
            onPress={PreferenceTogglers.toggleKey("quickScroll")}
            RightElement={<Switch enabled={quickScroll} />}
          />
          <SegmentedList.Item
            labelTextKey="feat.artwork.extra.square"
            onPress={PreferenceTogglers.toggleKey("squareArtwork")}
            RightElement={<Switch enabled={squareArtwork} />}
          />
        </SegmentedList>
      </ListLayout>
    </>
  );
}
