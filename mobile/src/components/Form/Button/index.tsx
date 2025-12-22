import type { PressableProps } from "react-native";
import { Pressable } from "react-native";

import { cn } from "~/lib/style";

export function Button({ className, ...props }: PressableProps) {
  return (
    <Pressable
      className={cn(
        "min-h-12 min-w-12 items-center justify-center gap-2 rounded-md bg-surface p-4",
        "active:opacity-75 disabled:opacity-25",
        className,
      )}
      {...props}
    />
  );
}
