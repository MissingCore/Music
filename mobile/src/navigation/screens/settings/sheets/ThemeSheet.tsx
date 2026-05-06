import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { View } from "react-native";

import { db } from "~/db";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { DetachedSheet } from "~/components/Sheet";
import { HorizontalRadioList } from "~/components/Sheet/HorizontalRadioList";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { TStyledText } from "~/components/Typography/StyledText";
import {
  DefaultThemeOptions,
  Themes,
  SystemTheme,
} from "~/modules/theme/constants";
import { isDefaultTheme } from "~/modules/theme/utils";

const ThemePreviewColor = {
  light: Themes.light.surfaceContainerLowest,
  dark: Themes.dark.surfaceContainerLowest,
  system: SystemTheme.surfaceContainerLowest,
} as const;

export function ThemeSheet(props: { ref: TrueSheetRef }) {
  const selectedScheme = usePreferenceStore((s) => s.theme);
  const activeCustomThemeId = usePreferenceStore((s) => s.activeCustomThemeId);
  const { data } = useCustomThemes();

  const themeOptions = useMemo(() => {
    if (!data) return DefaultThemeOptions;
    return [...DefaultThemeOptions, ...data.map((theme) => theme.id)];
  }, [data]);

  const themeMap = useMemo(() => {
    if (!data) return {};
    return Object.fromEntries(data.map((theme) => [theme.id, theme]));
  }, [data]);

  const selectedTheme = activeCustomThemeId || selectedScheme;

  return (
    <DetachedSheet ref={props.ref} titleKey="feat.theme.title">
      <HorizontalRadioList
        data={themeOptions}
        selected={selectedTheme}
        onPress={PreferenceSetters.setTheme}
        renderPreview={(theme) => (
          <View
            style={{
              backgroundColor: isDefaultTheme(theme)
                ? ThemePreviewColor[theme]
                : (themeMap[theme]?.surfaceContainerLowest ?? "#FFF"),
            }}
            className="size-full"
          />
        )}
        renderLabel={(theme) => (
          <TStyledText
            textKey={`feat.theme.extra.${theme}`}
            className="text-center text-xs"
          />
        )}
      />
    </DetachedSheet>
  );
}

const queryKey = ["custom-themes"];

async function getAllCustomThemes() {
  return db.query.customThemes.findMany({
    orderBy: (fields, { asc }) => asc(fields.name),
  });
}

export function useCustomThemes() {
  return useQuery({ queryKey, queryFn: getAllCustomThemes });
}
