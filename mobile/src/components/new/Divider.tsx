import { View } from "react-native";

import { cn } from "@/lib/style";

/** Simple `1px` tall divider. */
export function Divider({ className }: { className?: string }) {
  return <View className={cn("h-px flex-1 bg-foreground/10", className)} />;
}
