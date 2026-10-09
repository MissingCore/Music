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
import { IconButton } from "~/components/next/base/button-icon";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
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
    <Sheet ref={props.ref}>
      <Sheet.Header
        label={t("feat.theme.title")}
        Trailing={
          <IconButton
            icon="add"
            accessibilityLabel={t("form.create")}
            onPress={() => navigation.navigate("CreateTheme")}
            _iconSize={32}
          />
        }
      />
      <Sheet.List
        data={themeOptions}
        keyExtractor={(id) => id}
        extraData={selectedTheme}
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
              className="flex-1 rounded-[27] border border-transparent p-0.5"
            >
              <Button
                onPress={() => PreferenceSetters.setTheme(themeId)}
                disabled={selected}
                style={{ backgroundColor: surfaceContainerLowest }}
                rippleColor={surfaceContainerHigh}
                className="flex-row items-center disabled:opacity-100"
              >
                <Text
                  numberOfLines={1}
                  style={{ color: onSurface }}
                  className="shrink grow leading-tight"
                >
                  {name}
                </Text>
                <View className="-my-4 -mr-2 flex-row">
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
    <View className="mb-6">
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
