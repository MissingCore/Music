import { ActivityIndicator } from "react-native";

import Colors from "@/constants/Colors";
import { cn } from "@/lib/style";

/** @description General styling for `<ActivityIndicator />`. */
export function Spinner({ className }: { className?: string }) {
  return (
    <ActivityIndicator
      size="large"
      color={Colors.surface500}
      className={cn("mx-auto", className)}
    />
  );
}
