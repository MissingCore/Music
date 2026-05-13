import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import { TabOrderSheet } from "./sheets/TabOrderSheet";

import { SegmentedList } from "~/components/List/Segmented";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { Switch } from "~/components/UI/Switch";
import { getFontDisplayName } from "~/modules/customization/font/utils";

export default function AppearanceSettings() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const accentFont = usePreferenceStore((s) => s.accentFont);
  const primaryFont = usePreferenceStore((s) => s.primaryFont);
  const theme = usePreferenceStore((s) => s.theme);
  const activeCustomTheme = usePreferenceStore((s) => s.activeCustomTheme);
  const showNavbar = usePreferenceStore((s) => s.showNavbar);
  const quickScroll = usePreferenceStore((s) => s.quickScroll);
  const squareArtwork = usePreferenceStore((s) => s.squareArtwork);
  const tabOrderSheetRef = useSheetRef();

  return (
    <>
      <TabOrderSheet ref={tabOrderSheetRef} />

      <ListLayout>
        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.font.extra.accent"
            supportingText={getFontDisplayName(accentFont)}
            onPress={() => navigation.navigate("AccentFonts")}
          />
          <SegmentedList.Item
            labelTextKey="feat.font.extra.primary"
            supportingText={getFontDisplayName(primaryFont)}
            onPress={() => navigation.navigate("PrimaryFonts")}
          />
          <SegmentedList.Item
            labelTextKey="feat.theme.title"
            supportingText={
              activeCustomTheme?.name ?? t(`feat.theme.extra.${theme}`)
            }
            onPress={() => navigation.navigate("Themes")}
          />
        </SegmentedList>

        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.tabsOrder.extra.showNavbar"
            onPress={PreferenceTogglers.toggleKey("showNavbar")}
            RightElement={<Switch enabled={showNavbar} />}
          />
          <SegmentedList.Item
            labelTextKey="feat.tabsOrder.title"
            supportingText={t("feat.tabsOrder.brief")}
            onPress={() => tabOrderSheetRef.current?.present()}
          />
        </SegmentedList>

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
