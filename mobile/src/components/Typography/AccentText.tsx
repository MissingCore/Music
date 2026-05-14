import type { TextProps } from "react-native";
import { Text } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";

import { cn } from "~/lib/style";
import { getFont } from "~/modules/customization/font/utils";

/** `<Text />` that utilizes the accent font. */
export function AccentText({
  className,
  style,
  originalText,
  ...props
}: TextProps & {
  /** Ignore the uppercase behavior when the accent font is `NDot`. */
  originalText?: boolean;
}) {
  const accentFont = usePreferenceStore((s) => s.accentFont);
  return (
    <Text
      className={cn(
        "text-left text-4xl text-onSurface",
        { uppercase: accentFont === "NDot" && !originalText },
        className,
        "leading-tight",
      )}
      style={[{ fontFamily: getFont(accentFont, { headline: true }) }, style]}
      {...props}
    />
  );
}
