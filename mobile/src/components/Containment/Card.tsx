import { View } from "react-native";

import { cn } from "@/lib/style";

export const cardStyles = "rounded-md bg-surface p-4";

/** Basic reusable card component. */
export function Card(props: { children: React.ReactNode; className?: string }) {
  return (
    <View className={cn(cardStyles, props.className)}>{props.children}</View>
  );
}
