// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { Button } from "~/components/next/base/button";
import {
  FilledIconButton,
  IconButton,
} from "~/components/next/base/button-icon";
import type { SheetRef } from "~/components/next/base/sheet";
import {
  Sheet,
  SheetFooter,
  SheetLegendList,
} from "~/components/next/base/sheet";
import { Text } from "~/components/next/base/typography";
import { SegmentedPicker } from "~/components/next/blocks/segmented-picker";
import type { CustomTheme, ResolvedTheme } from "./core/constants";
import { DefaultThemeOptions } from "./core/constants";
import { exportTheme, useCustomThemes } from "./core/data";
import { formatCustomTheme } from "./utils";

export function ThemeSheet(props: { ref: SheetRef }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { data } = useCustomThemes();
  const selectedTheme = useSelectedTheme();

  const themeOptions = useMemo(() => {
    if (!data) return [];
    return data.map((theme) => theme.id);
  }, [data]);

  const themeMap = useMemo(() => {
    if (!data) return {};
    return Object.fromEntries(data.map((theme) => [theme.id, theme]));
  }, [data]);

  return (
    <Sheet
      ref={props.ref}
      footer={
        <SheetFooter className="items-center">
          <FilledIconButton
            icon="add"
            accessibilityLabel={t("form.create")}
            onPress={() => navigation.navigate("CreateTheme")}
            intent="inverse"
            wide
          />
        </SheetFooter>
      }
    >
      <SheetLegendList
        data={themeOptions}
        keyExtractor={(id) => id}
        extraData={[selectedTheme, themeMap]}
        renderItem={({ item: themeId }) => {
          const selected = selectedTheme === themeId;
          const {
            name,
            onSurface,
            onSurfaceVariant,
            surfaceContainerLowest,
            surfaceContainerHigh,
          } = themeMap[themeId]! as ResolvedTheme & { name: string };

          return (
            <View
              style={selected && { borderColor: onSurfaceVariant }}
              className="flex-1 rounded-[29] border-2 border-transparent p-0.75"
            >
              <Button
                onPress={() => PreferenceSetters.setTheme(themeId)}
                disabled={selected}
                style={{ backgroundColor: surfaceContainerLowest }}
                rippleColor={surfaceContainerHigh}
                className="flex-row items-center py-2 disabled:opacity-100"
              >
                <Text
                  numberOfLines={1}
                  style={{ color: onSurface }}
                  className="shrink grow"
                >
                  {name}
                </Text>
                <View className="-mr-2 flex-row">
                  <IconButton
                    icon="edit"
                    accessibilityLabel={t("form.edit")}
                    onPress={() =>
                      navigation.navigate("ModifyTheme", { id: themeId })
                    }
                    rippleColor={surfaceContainerHigh}
                    _iconColor={onSurface}
                  />
                  <IconButton
                    icon="file-save"
                    accessibilityLabel={t("feat.backup.extra.export")}
                    onPress={() =>
                      onExportTheme(formatCustomTheme(themeMap[themeId]!))
                    }
                    rippleColor={surfaceContainerHigh}
                    _iconColor={onSurface}
                  />
                </View>
              </Button>
            </View>
          );
        }}
        ListHeaderComponent={<BundledThemePicker />}
        contentContainerClassName="pb-0"
      />
    </Sheet>
  );
}

function BundledThemePicker() {
  const { t } = useTranslation();
  const selectedTheme = useSelectedTheme();

  const pickerOptions = DefaultThemeOptions.map((option) => ({
    label: t(`feat.theme.extra.${option}`),
    value: option,
  }));

  return (
    <View className="mb-4">
      <SegmentedPicker
        type="radio"
        options={pickerOptions}
        selected={selectedTheme}
        onSelect={PreferenceSetters.setTheme}
      />
    </View>
  );
}

//#region Helpers
function useSelectedTheme() {
  const selectedScheme = usePreferenceStore((s) => s.theme);
  const activeCustomThemeId = usePreferenceStore((s) => s.activeCustomThemeId);
  return activeCustomThemeId || selectedScheme;
}

async function onExportTheme(theme: CustomTheme) {
  try {
    await exportTheme(theme);
    toast.t("feat.backup.extra.exportSuccess");
  } catch (err) {
    toast.error((err as Error).message);
  }
}
//#endregion
