// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";
import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { ViewPreferenceSetters } from "~/stores/ViewPreference/actions";
import {
  GridColumnSizeConfig,
  ListColumnSizeConfig,
} from "~/stores/ViewPreference/utils";
import {
  useCompactGridLayoutConfig,
  useGridLayoutConfig,
  useListLayoutConfig,
} from "~/hooks/useLayoutConfigs";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import { TabOrderSheet } from "./sheets/TabOrderSheet";

import { Divider } from "~/components/Divider";
import { LabeledSlider } from "~/components/Form/Slider.variant";
import { SegmentedList } from "~/components/List/Segmented";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import {
  StyledText,
  TEm,
  TStyledText,
} from "~/components/Typography/StyledText";
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
            labelText="feat.font.extra.accent"
            supportingText={getFontDisplayName(accentFont)}
            onPress={() => navigation.navigate("AccentFonts")}
          />
          <SegmentedList.Item
            labelText="feat.font.extra.primary"
            supportingText={getFontDisplayName(primaryFont)}
            onPress={() => navigation.navigate("PrimaryFonts")}
          />
          <SegmentedList.Item
            labelText="feat.theme.title"
            supportingText={
              activeCustomTheme?.name ?? t(`feat.theme.extra.${theme}`)
            }
            onPress={() => navigation.navigate("Themes")}
          />
        </SegmentedList>

        <SegmentedList>
          <SegmentedList.Item
            labelText="feat.tabsOrder.extra.showNavbar"
            onPress={PreferenceTogglers.toggleKey("showNavbar")}
            Trailing={<Switch enabled={showNavbar} />}
          />
          <SegmentedList.Item
            labelText="feat.tabsOrder.title"
            supportingText={t("feat.tabsOrder.brief")}
            onPress={() => tabOrderSheetRef.current?.present()}
          />
        </SegmentedList>

        <SegmentedList>
          <SegmentedList.Item
            labelText="feat.quickScroll.title"
            supportingText={t("feat.quickScroll.brief")}
            onPress={PreferenceTogglers.toggleKey("quickScroll")}
            Trailing={<Switch enabled={quickScroll} />}
          />
          <SegmentedList.Item
            labelText="feat.artwork.extra.square"
            onPress={PreferenceTogglers.toggleKey("squareArtwork")}
            Trailing={<Switch enabled={squareArtwork} />}
          />
        </SegmentedList>

        <GridColumnSizeSetting />
      </ListLayout>
    </>
  );
}

//#region Grid Column Size Settings
function GridColumnSizeSetting() {
  return (
    <SegmentedList.CustomItem className="gap-6 p-4">
      <TStyledText
        textKey="feat.modalViewPreference.extra.columnSize"
        className="text-sm"
      />
      <Divider className="-my-2" />
      <ColumnSizeSlider field="list" />
      <ColumnSizeSlider field="grid" />
      <ColumnSizeSlider field="compactGrid" />
    </SegmentedList.CustomItem>
  );
}

const ColumnConfig = {
  list: { bound: ListColumnSizeConfig.bound, hook: useListLayoutConfig },
  grid: { bound: GridColumnSizeConfig.bound, hook: useGridLayoutConfig },
  compactGrid: {
    bound: GridColumnSizeConfig.bound,
    hook: useCompactGridLayoutConfig,
  },
} as const;

function ColumnSizeSlider(props: { field: keyof typeof ColumnConfig }) {
  const fieldName = `${props.field}Size` as const;

  const { t } = useTranslation();
  const columnSize = useViewPreferenceStore((s) => s[fieldName]);
  const cachedValue = useSharedValue(columnSize);
  const [_columnSize, _setColumnSize] = useState(columnSize);

  useAnimatedReaction(
    () => cachedValue.get(),
    (currVal) => scheduleOnRN(_setColumnSize, currVal),
  );

  const Config = ColumnConfig[props.field];

  //? Column calculation is different based on the grid layout.
  const { count } = Config.hook({ minWidth: _columnSize });

  return (
    <View className="gap-2">
      <TEm textKey={`feat.modalViewPreference.extra.${props.field}`} />
      <LabeledSlider
        initValue={columnSize}
        liveValue={cachedValue}
        {...Config.bound}
        onComplete={ViewPreferenceSetters.setColumnSize(fieldName)}
        displayedValue={String(_columnSize)}
      />
      <StyledText dim className="-mt-3">
        {t("feat.modalViewPreference.extra.columnCount", { count })}
      </StyledText>
    </View>
  );
}
//#endregion
