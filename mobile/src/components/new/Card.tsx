import { View } from "react-native";

import { cn } from "@/lib/style";

export const cardStyles = "rounded-md bg-surface p-4";

/** Basic reusable card component. */
export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <View className={cn(cardStyles, className)}>{children}</View>;
}
