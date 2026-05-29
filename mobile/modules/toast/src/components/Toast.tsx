import { useCallback, useEffect } from "react";
import { StyleSheet, Text, useWindowDimensions } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { useToastStore } from "../core/store";
import type { Toast as ToastData, ToastTheme } from "../core/types";

type Props = {
  toast: ToastData;
  exiting?: boolean;
  theme: ToastTheme;
};

export function Toast({ toast, exiting, theme }: Props) {
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

  const panGesture = usePanGesture({
    enabled: !exiting,
    activeOffsetY: [-10, 10],
    onUpdate: ({ translationY }) => panAmount.set(Math.min(0, translationY)),
    onDeactivate: ({ velocityY }) => {
      const metThreshold = velocityY < -500;
      panAmount.set(
        withSpring(
          metThreshold ? -(topOffset + toastHeight.get() + 256) : 0,
          undefined,
          (finished) => {
            if (finished && metThreshold) scheduleOnRN(onRemove);
          },
        ),
      );
    },
  });
  //#endregion

  //#region Enter/Exit Animations
  useEffect(() => {
    animationState.set(
      withTiming(exiting ? 0 : 1, undefined, (finished) => {
        if (finished && exiting) scheduleOnRN(onRemove);
      }),
    );

    //? Auto-dismiss toast after `4s` if `toast.autoDismiss = true`.
    let autoDismissTimer: ReturnType<typeof setTimeout>;
    if (toast.autoDismiss && !exiting) {
      autoDismissTimer = setTimeout(() => {
        animationState.set(
          withTiming(0, undefined, (finished) => {
            if (finished) scheduleOnRN(onRemove);
          }),
        );
      }, 4300);
    }

    return () => {
      if (autoDismissTimer) clearTimeout(autoDismissTimer);
    };
  }, [animationState, exiting, onRemove, toast.autoDismiss]);

  const toastStyles = useAnimatedStyle(() => ({
    top: topOffset,
    maxWidth: Math.min(384, windowDimensions.width - 32),
    opacity: animationState.get(),
    transform: [
      { translateX: "-50%" },
      {
        translateY:
          panAmount.get() < 0
            ? panAmount.get()
            : `${-100 + animationState.get() * 100}%`,
      },
    ],
  }));
  //#endregion

  const decideColor = useCallback(
    (errorColor: string, defaultColor: string) =>
      toast.type === "error" ? errorColor : defaultColor,
    [toast.type],
  );

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        onLayout={(e) => toastHeight.set(e.nativeEvent.layout.height)}
        style={[
          styles.container,
          {
            backgroundColor: decideColor(theme.error, theme.surface),
            borderColor: decideColor(theme.error, theme.surfaceBorder),
          },
          toastStyles,
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: decideColor(theme.onError, theme.onSurface),
              fontFamily: theme.fontFamily,
            },
          ]}
        >
          {toast.message}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: "50%",
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
  },
  text: {
    fontSize: 14,
    textAlign: "center",
  },
});
