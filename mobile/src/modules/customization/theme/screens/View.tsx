import { toast } from "@missingcore/ui/toast";
import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Icon } from "~/resources/icons";
import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { cn } from "~/lib/style";
import { FlatList } from "~/components/Base/List";
import { Pressable } from "~/components/Base/Pressable";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { StyledText } from "~/components/Typography/StyledText";
import type { CustomTheme, HexColor } from "../core/constants";
import {
  DefaultThemeOptions,
  Themes as DefaultThemes,
  SystemTheme,
} from "../core/constants";
import { exportTheme, useCustomThemes } from "../core/data";
import { formatCustomTheme, isDefaultTheme } from "../utils";

const DefaultThemeMap = {
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
            icon="add"
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
            ? DefaultThemeMap[themeId]
            : themeMap[themeId]!;

          return (
            <Pressable
              onPress={() => PreferenceSetters.setTheme(themeId)}
              className={cn(
                "min-h-14 flex-row items-center gap-2 rounded-md p-2 pl-4 active:opacity-75",
                {
                  "mt-0.75 rounded-t-xs": index > 0,
                  "rounded-b-xs": index < themeOptions.length - 1,
                },
              )}
              style={{ backgroundColor: themeColors.surfaceContainerLowest }}
            >
              <View
                className={cn(
                  "size-5 items-center justify-center rounded-full border",
                  { "border-0 bg-onSurface": selected },
                )}
                style={{ borderColor: themeColors.onSurface }}
              >
                {selected ? (
                  <Icon name="check" size={18} color="surface" />
                ) : null}
              </View>
              <StyledText
                style={{ color: themeColors.onSurface }}
                className="shrink grow"
              >
                {isDefaultTheme(themeId)
                  ? t(`feat.theme.extra.${themeId}`)
                  : themeMap[themeId]!.name}
              </StyledText>
              {!isDefaultTheme(themeId) ? (
                <View className="flex-row items-center">
                  <IconButton
                    icon="edit"
                    accessibilityLabel={t("form.edit")}
                    onPress={() =>
                      navigation.navigate("ModifyTheme", { id: themeId })
                    }
                    _iconColor={themeColors.onSurface as HexColor}
                    _rippleColor={themeColors.surfaceContainerHigh as HexColor}
                  />
                  <IconButton
                    icon="file-save"
                    accessibilityLabel={t("feat.backup.extra.export")}
                    onPress={() =>
                      onExportTheme(formatCustomTheme(themeMap[themeId]!))
                    }
                    _iconColor={themeColors.onSurface as HexColor}
                    _rippleColor={themeColors.surfaceContainerHigh as HexColor}
                  />
                </View>
              ) : null}
            </Pressable>
          );
        }}
        contentContainerClassName="p-4"
      />
    </>
  );
}

//#region Helpers
async function onExportTheme(theme: CustomTheme) {
  try {
    await exportTheme(theme);
    toast.t("feat.backup.extra.exportSuccess");
  } catch (err) {
    toast.error((err as Error).message);
  }
}
//#endregion
