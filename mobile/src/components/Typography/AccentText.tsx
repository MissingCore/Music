import type { TextProps } from "react-native";
import { Text } from "react-native";

import { useUserPreferencesStore } from "~/services/UserPreferences";

import { cn, getAccentFont } from "~/lib/style";

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
  const accentFont = useUserPreferencesStore((state) => state.accentFont);
  return (
    <Text
      className={cn(
        "text-foreground",
        { uppercase: accentFont === "NDot" && !originalText },
        className,
        "leading-tight",
      )}
      style={[{ fontFamily: getAccentFont(accentFont) }, style]}
      {...props}
    />
  );
}
