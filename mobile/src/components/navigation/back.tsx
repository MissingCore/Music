import { router } from "expo-router";
import { useEffect } from "react";

import { ArrowRight } from "@/resources/icons/ArrowRight";

import { StyledPressable } from "../ui/pressable";

/** Navigate back when rendered. */
export function Back() {
  useEffect(() => {
    router.back();
  }, []);

  return null;
}

/** Custom back button to replace the one used by React Navigation. */
export function BackButton(props: { className?: string }) {
  return (
    <StyledPressable
      accessibilityLabel="Go back."
      onPress={() => router.back()}
      forIcon
      className={props.className}
    >
      <ArrowRight size={24} className="rotate-180" />
    </StyledPressable>
  );
}
