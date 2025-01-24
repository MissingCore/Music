import { View } from "react-native";

import { cn } from "~/lib/style";

/** Basic reusable card component. */
export function Card(props: { children: React.ReactNode; className?: string }) {
  return (
    <View className={cn("rounded-md bg-surface p-4", props.className)}>
      {props.children}
    </View>
  );
}
