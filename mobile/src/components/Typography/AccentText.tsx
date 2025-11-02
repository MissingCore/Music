import type { TextProps } from "react-native";
import { Text } from "react-native";

import { useUserPreferenceStore } from "~/stores/UserPreference/store";

import { cn, getFont } from "~/lib/style";

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
  const accentFont = useUserPreferenceStore((s) => s.accentFont);
  return (
    <Text
      className={cn(
        "text-left text-foreground",
        { uppercase: accentFont === "NDot" && !originalText },
        className,
        "leading-tight",
      )}
      style={[{ fontFamily: getFont(accentFont) }, style]}
      {...props}
    />
  );
}
