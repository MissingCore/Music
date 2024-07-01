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
    <Pressable accessibilityLabel="Go back." onPress={() => router.back()}>
      <ArrowRight
        size={24}
        className={cn(
          "rotate-180",
          { "mr-8": !props.unstyled },
          props.className,
        )}
      />
    </Pressable>
  );
}
