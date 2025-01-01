import type { TextProps } from "react-native";
import { Text } from "react-native";

import { useUserPreferencesStore } from "@/services/UserPreferences";

import { cn } from "@/lib/style";

/** `<Text />` that utilizes the accent font. */
export function AccentText({
  className,
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
        {
          "font-ndot": accentFont === "NDot",
          uppercase: accentFont === "NDot" && !originalText,
          "font-ntype": accentFont === "NType",
        },
        className,
        "leading-tight",
      )}
      {...props}
    />
  );
}
