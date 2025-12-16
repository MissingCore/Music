import { View } from "react-native";

import { Check } from "~/resources/icons/Check";
import { useTheme } from "~/hooks/useTheme";

import { cn } from "~/lib/style";

export function Checkbox({ checked }: { checked: boolean }) {
  const { canvas } = useTheme();
  return (
    <View
      className={cn(
        "size-4 items-center justify-center rounded-xs border border-foreground",
        { "bg-foreground": checked },
      )}
    >
      {checked ? <Check size={16} color={canvas} /> : null}
    </View>
  );
}
