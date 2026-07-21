// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { usePreferenceStore } from "~/stores/Preference/store";
import {
  PreferenceSetters,
  PreferenceTogglers,
} from "~/stores/Preference/actions";
import { GridColumnSizeConfig } from "~/stores/Preference/utils";
import { ColumnPresets, useGetColumn } from "~/hooks/useGetColumn";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import { TabOrderSheet } from "./sheets/TabOrderSheet";

import { LabeledSlider } from "~/components/Form/Slider.variant";
import { SegmentedList } from "~/components/List/Segmented";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";
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

        <GridColumnSizeSetting />
      </ListLayout>
    </>
  );
}

function GridColumnSizeSetting() {
  const { t } = useTranslation();
  const gridColumnSize = usePreferenceStore((s) => s.gridColumnSize);
  const cachedValue = useSharedValue(gridColumnSize);
  const [_gridColumnSize, _setGridColumnSize] = useState(gridColumnSize);

  useAnimatedReaction(
    () => cachedValue.get(),
    (currVal) => scheduleOnRN(_setGridColumnSize, currVal),
  );

  const { count } = useGetColumn({
    ...ColumnPresets.gridLayout,
    minWidth: _gridColumnSize,
  });

  return (
    <SegmentedList.CustomItem className="gap-4 p-4">
      <TStyledText
        textKey="feat.modalViewPreference.extra.gridColumnSize"
        className="text-sm"
      />
      <LabeledSlider
        initValue={gridColumnSize}
        liveValue={cachedValue}
        {...GridColumnSizeConfig.bound}
        onChange={PreferenceSetters.setGridColumnSize}
        displayedValue={String(_gridColumnSize)}
      />
      <StyledText dim className="-mt-2">
        {t("feat.modalViewPreference.extra.gridColumnCount", { count })}
      </StyledText>
    </SegmentedList.CustomItem>
  );
}
