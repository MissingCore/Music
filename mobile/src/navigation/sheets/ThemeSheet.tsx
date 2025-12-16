import { View } from "react-native";
import { Uniwind } from "uniwind";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";
import { Themes, SystemTheme } from "~/hooks/useTheme";

import { DetachedSheet } from "~/components/Sheet/Detached";
import { HorizontalRadioList } from "~/components/Sheet/HorizontalRadioList";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
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
      <HorizontalRadioList
        data={ThemeOptions}
        selected={selectedTheme}
        onPress={(theme) => {
          Uniwind.setTheme(theme);
          PreferenceSetters.setTheme(theme);
        }}
        renderPreview={(theme) => (
          <View
            style={{ backgroundColor: ThemePreviewColor[theme] }}
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
