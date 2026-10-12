// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { cn } from "~/lib/style";
import type { TextProps } from "../base/typography";
import { Text } from "../base/typography";

interface TextStackProps {
  label: string;
  supporting?: string;
  labelConfig?: TextProps;
  supportingConfig?: TextProps;
  /** Applies `numberOfLines = 1`. */
  clamp?: boolean;
  /** Styles the `View` wrapping the text. */
  containerClassName?: string;
}

/** Generates a React Component that is built to the specified configurations. */
export function createTextStack({
  labelConfig,
  supportingConfig,
  clamp = false,
  containerClassName,
}: Omit<TextStackProps, "label" | "supporting">) {
  return function TextStack(props: TextStackProps) {
    const numLines = clamp || props.clamp ? 1 : undefined;

    return (
      <View
        className={cn(
          "shrink grow",
          containerClassName,
          props.containerClassName,
        )}
      >
        <Text
          {...labelConfig}
          {...props.labelConfig}
          numberOfLines={numLines}
          className={cn(labelConfig?.className, props.labelConfig?.className)}
        >
          {props.label}
        </Text>
        {props.supporting ? (
          <Text
            {...supportingConfig}
            {...props.supportingConfig}
            numberOfLines={numLines}
            className={cn(
              supportingConfig?.className,
              props.supportingConfig?.className,
            )}
          >
            {props.supporting}
          </Text>
        ) : null}
      </View>
    );
  };
}

export const TextStack = createTextStack({
  labelConfig: { size: "sm" },
  supportingConfig: { muted: true },
});
