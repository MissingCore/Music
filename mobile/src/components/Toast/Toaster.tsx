import { useCallback, useEffect, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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
      key={toast.id}
      toast={toast}
      exiting={index === 0 && visibleToasts.length > 1}
    />
  ));
}

function ToastItem({ toast, exiting }: { toast: Toast; exiting?: boolean }) {
  const insets = useSafeAreaInsets();
  const windowDimensions = useWindowDimensions();
  const removeToast = useToastStore((s) => s.removeToast);
  const animationState = useSharedValue(0);
  const toastHeight = useSharedValue(0);

  const topOffset = insets.top + 16;

  const onRemove = useCallback(
    () => removeToast(toast.id),
    [removeToast, toast.id],
  );

  //#region Dismiss Gesture
  const panAmount = useSharedValue(0);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!exiting)
        .activeOffsetY([-10, 10])
        .onUpdate(({ translationY }) => {
          panAmount.value = Math.min(0, translationY);
        })
        .onEnd(({ velocityY }) => {
          const metThreshold = velocityY < -1000;
          panAmount.value = withSpring(
            metThreshold ? -(topOffset + toastHeight.value + 256) : 0,
            undefined,
            (finished) => {
              if (finished && metThreshold) scheduleOnRN(onRemove);
            },
          );
        }),
    [panAmount, toastHeight, topOffset, exiting, onRemove],
  );
  //#endregion

  //#region Enter/Exit Animations
  useEffect(() => {
    animationState.value = withTiming(
      exiting ? 0 : 1,
      undefined,
      (finished) => {
        if (finished && exiting) scheduleOnRN(onRemove);
      },
    );

    //? Auto-dismiss toast after `4s` if `toast.autoDismiss = true`.
    let autoDismissTimer: ReturnType<typeof setTimeout>;
    if (toast.autoDismiss && !exiting) {
      autoDismissTimer = setTimeout(() => {
        animationState.value = withTiming(0, undefined, (finished) => {
          if (finished) scheduleOnRN(onRemove);
        });
      }, 4300);
    }

    return () => {
      if (autoDismissTimer) clearTimeout(autoDismissTimer);
    };
  }, [animationState, exiting, onRemove, toast.autoDismiss]);

  const toastStyles = useAnimatedStyle(() => ({
    top: topOffset,
    maxWidth: Math.min(384, windowDimensions.width - 32),
    opacity: animationState.value,
    transform: [
      { translateX: "-50%" },
      {
        translateY:
          panAmount.value < 0
            ? panAmount.value
            : `${-100 + animationState.value * 100}%`,
      },
    ],
  }));
  //#endregion

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        onLayout={(e) => {
          toastHeight.value = e.nativeEvent.layout.height;
        }}
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
    </GestureDetector>
  );
}
