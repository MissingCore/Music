import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable } from "react-native";

import { ArrowRight } from "@/assets/svgs/ArrowRight";

import { cn } from "@/lib/style";

/** @description Navigate back when rendered. */
export function Back() {
  useEffect(() => {
    router.back();
  }, []);

  return null;
}

/** @description Custom back button to replace the one used by React Navigation. */
export function BackButton(props: { unstyled?: boolean; className?: string }) {
  return (
    <Pressable
      accessibilityLabel="Go back."
      onPress={() => router.back()}
      className={cn(
        "active:opacity-75",
        { "mr-8": !props.unstyled },
        props.className,
      )}
    >
      <ArrowRight size={24} className="rotate-180" />
    </Pressable>
  );
}
