import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { db } from "~/db";

import { Add } from "~/resources/icons/Add";
import { Check } from "~/resources/icons/Check";
import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { cn } from "~/lib/style";
import { FlatList } from "~/components/Base/List";
import { Pressable } from "~/components/Base/Pressable";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { StyledText } from "~/components/Typography/StyledText";
import {
  DefaultThemeOptions,
  Themes as DefaultThemes,
  SystemTheme,
} from "~/modules/theme/constants";
import { isDefaultTheme } from "~/modules/theme/utils";

const ThemeMap = {
  light: DefaultThemes.light,
  dark: DefaultThemes.dark,
  system: SystemTheme,
} as const;

export default function Themes() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isPending, data } = useCustomThemes();
  const selectedScheme = usePreferenceStore((s) => s.theme);
  const activeCustomThemeId = usePreferenceStore((s) => s.activeCustomThemeId);

  const themeOptions = useMemo(() => {
    if (!data) return DefaultThemeOptions;
    return [...DefaultThemeOptions, ...data.map((theme) => theme.id)];
  }, [data]);

  const themeMap = useMemo(() => {
    if (!data) return {};
    return Object.fromEntries(data.map((theme) => [theme.id, theme]));
  }, [data]);

  const selectedTheme = activeCustomThemeId || selectedScheme;

  if (isPending) return <PagePlaceholder isPending={isPending} />;
  return (
    <>
      <ScreenOptions
        headerRight={() => (
          <FilledIconButton
            Icon={Add}
            accessibilityLabel={t("form.create")}
            onPress={() => navigation.navigate("CreateTheme")}
          />
        )}
      />
      <FlatList
        data={themeOptions}
        keyExtractor={(id) => id}
        renderItem={({ item: themeId, index }) => {
          const selected = selectedTheme === themeId;
          const themeColors = isDefaultTheme(themeId)
            ? ThemeMap[themeId]
            : themeMap[themeId]!;

          return (
            <Pressable
              onPress={() => PreferenceSetters.setTheme(themeId)}
              className={cn(
                "min-h-12 flex-row items-center gap-2 rounded-md p-4",
                {
                  "mt-0.75 rounded-t-xs": index > 0,
                  "rounded-b-xs": index < themeOptions.length - 1,
                },
              )}
              style={({ pressed }) => ({
                backgroundColor: pressed
                  ? themeColors.surfaceContainerLow
                  : themeColors.surfaceContainerLowest,
              })}
            >
              <View
                className={cn(
                  "size-5 items-center justify-center rounded-full border border-onSurface",
                  { "border-0 bg-onSurface": selected },
                )}
                style={[
                  { borderColor: themeColors.onSurface },
                  selected && { backgroundColor: themeColors.onSurface },
                ]}
              >
                {selected ? <Check size={18} color="surface" /> : null}
              </View>
              <StyledText style={{ color: themeColors.onSurface }}>
                {isDefaultTheme(themeId)
                  ? t(`feat.theme.extra.${themeId}`)
                  : themeMap[themeId]!.name}
              </StyledText>
            </Pressable>
          );
        }}
        contentContainerClassName="p-4"
      />
    </>
  );
}

//#region Query
const queryKey = ["custom-themes"];

async function getAllCustomThemes() {
  return db.query.customThemes.findMany({
    orderBy: (fields, { asc }) => asc(fields.name),
  });
}

export function useCustomThemes() {
  return useQuery({ queryKey, queryFn: getAllCustomThemes });
}
//#endregion
