import type { TextProps } from "react-native";
import { Text } from "react-native";

import { useUserPreferencesStore } from "@/services/UserPreferences";

import { cn } from "@/lib/style";

/** `<Text />` that utilizes the accent font. */
export function AccentText({ className, ...rest }: TextProps) {
  const accentFont = useUserPreferencesStore((state) => state.accentFont);
  return (
    <Text
      className={cn(
        "text-foreground",
        {
          "font-ndot": accentFont === "NDot",
          "font-ntype": accentFont === "NType",
        },
        className,
      )}
      {...rest}
    />
  );
}
