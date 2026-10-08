// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { OnRTLWorklet } from "~/lib/react";
import { cn } from "~/lib/style";
import { Pressable } from "../primitive/pressable";

export function Switch({
  enabled,
  interactable = false,
}: {
  enabled: boolean;
  interactable?: boolean;
}) {
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(enabled ? OnRTLWorklet.decide(-12, 12) : 0, {
          duration: 150,
        }),
      },
    ],
  }));
  return (
    <Animated.View
      pointerEvents={!interactable ? "none" : undefined}
      className={cn("w-10 rounded-full bg-surfaceContainerHigh p-0.5", {
        "bg-primary": enabled,
      })}
    >
      <Animated.View
        style={thumbStyle}
        className="size-6 rounded-full bg-onPrimary"
      />
    </Animated.View>
  );
}

export function SwitchInput(props: {
  enabled: boolean;
  onPress: VoidFunction;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: props.enabled, disabled: props.disabled }}
      onPress={props.onPress}
      disabled={props.disabled}
      className="h-8 justify-center disabled:opacity-25"
    >
      <Switch enabled={props.enabled} interactable />
    </Pressable>
  );
}
