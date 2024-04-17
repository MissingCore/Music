import { router } from "expo-router";
import { Pressable } from "react-native";

import { ArrowRight } from "@/assets/svgs/ArrowRight";

import { cn } from "@/lib/style";

/** @description Custom back button to replace the one used by React Navigation. */
export function BackButton() {
  return (
    <Pressable onPress={() => router.back()}>
      <ArrowRight size={24} className="mr-8 rotate-180" />
    </Pressable>
  );
}

/** @description Allows for styling via `className`. */
export function UnstyledBackButton({ className }: { className?: string }) {
  return (
    <Pressable onPress={() => router.back()}>
      <ArrowRight size={24} className={cn("rotate-180", className)} />
    </Pressable>
  );
}
