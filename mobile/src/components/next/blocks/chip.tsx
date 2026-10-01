// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import { View } from "react-native";

import { cn } from "~/lib/style";
import { Button } from "./button";
import type { Intent } from "../base/theming";
import { Text, TText } from "../base/typography";
import type { PressProps } from "../primitive/pressable";

interface ChipProps extends PressProps {
  intent?: Intent;
  label?: ParseKeys;
  labelText?: string;
  pill?: boolean;
  className?: string;
}

export function Chip({
  intent,
  label,
  labelText,
  pill,
  className,
  ...props
}: ChipProps) {
  const Wrapper = Object.keys(props).length > 0 ? Button : View;
  const textProps = { intent, size: "xs" } as const;
  return (
    <Wrapper
      {...props}
      intent={intent}
      filled
      className={cn(
        "min-h-0 rounded-sm px-3 py-1 disabled:opacity-100",
        pill && "rounded-full",
        className,
      )}
    >
      {label ? (
        <TText textKey={label} {...textProps} />
      ) : (
        <Text {...textProps}>{labelText}</Text>
      )}
    </Wrapper>
  );
}
