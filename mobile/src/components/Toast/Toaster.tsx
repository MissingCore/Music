import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useToastStore } from "./store";
import type { Toast } from "./types";

import { cn } from "~/lib/style";
import { StyledText } from "../Typography/StyledText";
import { scheduleOnRN } from "react-native-worklets";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  //? We'll have at most 2 toasts rendered at once (with one of them animating away).
  const visibleToasts = toasts.slice(0, 2);

  return visibleToasts.map((toast, index) => (
    <ToastItem
      //? The `key` is to prevent re-mounting when the other toast is removed.
      key={toast.key}
      toast={toast}
      exiting={index === 0 && visibleToasts.length > 1}
    />
  ));
}

function ToastItem({ toast, exiting }: { toast: Toast; exiting?: boolean }) {
  const insets = useSafeAreaInsets();
  const windowDimensions = useWindowDimensions();
  const onRemove = useToastStore((s) => s.shiftToast);
  const animationState = useSharedValue(0);

  useEffect(() => {
    animationState.value = withTiming(
      exiting ? 0 : 1,
      { duration: 500 },
      (finished) => {
        if (finished && exiting) scheduleOnRN(onRemove);
      },
    );
  }, [animationState, exiting, onRemove]);

  const toastStyles = useAnimatedStyle(() => ({
    top: insets.top + 16,
    maxWidth: Math.min(384, windowDimensions.width - 32),
    opacity: animationState.value,
    transform: [
      { translateX: "-50%" },
      { translateY: `${-100 + animationState.value * 100}%` },
    ],
  }));

  return (
    <Animated.View
      style={toastStyles}
      className={cn(
        "absolute left-1/2 min-h-6 items-center justify-center rounded-sm border border-surfaceContainerHigh bg-surfaceContainerLowest p-2",
        { "border-error bg-error": toast.type === "error" },
      )}
    >
      <StyledText
        className={cn("text-center text-sm", {
          "text-onError": toast.type === "error",
        })}
      >
        {toast.message}
      </StyledText>
    </Animated.View>
  );
}
