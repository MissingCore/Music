import { router } from "expo-router";
import { Pressable } from "react-native";

import { ArrowRight } from "@/assets/svgs/ArrowRight";

/** @description Custom back button to replace the one used by React Navigation. */
export function BackButton() {
  return (
    <Pressable onPress={() => router.back()}>
      <ArrowRight size={24} className="mr-8 rotate-180" />
    </Pressable>
  );
}
