// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { VariantProps } from "cva/config";
import { View } from "react-native";

import { cva } from "~/lib/style";
import { Ripple } from "./ripple";
import { baseContainerStyle, getIntentRippleColor } from "./styles";
import { Text } from "./typography";
import type { PressProps } from "../primitive/pressable";

const chipStyle = cva({
  composes: [baseContainerStyle],
  base: "rounded-sm px-3 py-1.5",
  variants: {
    pill: { true: "rounded-full" },
  },
  defaultVariants: { filled: true, pill: false },
});

interface ChipProps
  extends PressProps, Omit<VariantProps<typeof chipStyle>, "filled"> {
  label?: string;
  className?: string;
}

export function Chip({
  intent,
  outline,
  pill,
  className,
  label,
  ...props
}: ChipProps) {
  const Wrapper = props.onPress ? Ripple : View;
  const textProps = { intent, size: "xs" } as const;
  return (
    <Wrapper
      {...props}
      rippleColor={getIntentRippleColor(intent)}
      className={chipStyle({ intent, outline, pill, className })}
    >
      <Text {...textProps}>{label}</Text>
    </Wrapper>
  );
}
