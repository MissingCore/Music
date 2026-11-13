// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { cn } from "~/lib/style";
import type { TextProps } from "./typography";
import { Text } from "./typography";

interface TextStackConfiguration {
  labelConfig?: TextProps;
  supportingConfig?: TextProps;
  sharedConfig?: TextProps;
  /** Applies `numberOfLines = 1`. */
  clamp?: boolean;
  /** Styles the `View` wrapping the text. */
  containerClassName?: string;
}

interface TextStackProps extends Pick<TextStackConfiguration, "clamp"> {
  label: string;
  supporting?: string;
}

export function createTextStack({
  labelConfig = {},
  supportingConfig = {},
  sharedConfig = {},
  clamp = false,
  containerClassName,
}: TextStackConfiguration) {
  const mergedLabelConfig = {
    ...labelConfig,
    ...sharedConfig,
    className: cn(labelConfig.className, sharedConfig.className),
  };
  const mergedSupportingConfig = {
    ...supportingConfig,
    ...sharedConfig,
    className: cn(supportingConfig.className, sharedConfig.className),
  };

  return function TextStack(props: TextStackProps) {
    const numLines = clamp || props.clamp ? 1 : undefined;
    return (
      <View className={cn("shrink grow", containerClassName)}>
        <Text {...mergedLabelConfig} numberOfLines={numLines}>
          {props.label}
        </Text>
        {props.supporting ? (
          <Text {...mergedSupportingConfig} numberOfLines={numLines}>
            {props.supporting}
          </Text>
        ) : null}
      </View>
    );
  };
}

export const TextStack = createTextStack({
  labelConfig: { size: "sm" },
  supportingConfig: { size: "xs", color: "onSurfaceVariant" },
});
