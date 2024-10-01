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
        {
          "font-ndot": accentFont === "ndot",
          "font-ntype": accentFont === "ntype",
        },
        className,
      )}
      {...rest}
    />
  );
}
