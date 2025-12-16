import { Pressable, View } from "react-native";
import { Uniwind } from "uniwind";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";
import { Themes, SystemTheme } from "~/hooks/useTheme";

import { cn } from "~/lib/style";
import { FlatList } from "~/components/Defaults";
import type { TrueSheetRef } from "~/components/Sheet";
import { DetachedSheet } from "~/components/Sheet/Detached";
import { TStyledText } from "~/components/Typography/StyledText";
import { ThemeOptions } from "~/stores/Preference/constants";

const ThemePreviewColor = {
  light: Themes.light.surface,
  dark: Themes.dark.surface,
  system: SystemTheme.surface,
} as const;

export function ThemeSheet(props: { ref: TrueSheetRef }) {
  const selectedTheme = usePreferenceStore((s) => s.theme);
  return (
    <DetachedSheet ref={props.ref} titleKey="feat.theme.title">
      <FlatList
        accessibilityRole="radiogroup"
        horizontal
        data={ThemeOptions}
        keyExtractor={(theme) => theme}
        renderItem={({ item: theme }) => {
          const selected = selectedTheme === theme;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => {
                Uniwind.setTheme(theme);
                PreferenceSetters.setTheme(theme);
              }}
              disabled={selected}
              className={cn(
                "w-21 items-center gap-2 rounded-sm border border-transparent p-2",
                { "border-red": selected },
              )}
            >
              <View
                style={{ backgroundColor: ThemePreviewColor[theme] }}
                className="size-16 rounded-sm"
              />
              <View className="min-h-6 shrink grow items-center justify-center">
                <TStyledText
                  textKey={`feat.theme.extra.${theme}`}
                  className="text-center text-xs"
                />
              </View>
            </Pressable>
          );
        }}
        className="-mx-4"
        contentContainerClassName="gap-4 px-4"
      />
    </DetachedSheet>
  );
}
