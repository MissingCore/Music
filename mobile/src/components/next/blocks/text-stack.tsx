// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import type { TextVariants } from "../base/typography";
import { Text } from "../base/typography";

interface TextStackProps {
  label: string;
  supporting?: string;
}

/** Generates a React Component that is built to the specified configurations. */
export function createTextStack(args: {
  labelConfig?: TextVariants;
  supportingConfig?: TextVariants;
  /** If `numberOfLines = 1` is applied to both fields. */
  clampText?: boolean;
}) {
  const additionalProps = {
    numberOfLines: args.clampText ? 1 : undefined,
  };

  const labelConfig = { ...args.labelConfig, ...additionalProps };
  const supportingConfig = { ...args.supportingConfig, ...additionalProps };

  function Label(props: { text: string; singular?: boolean }) {
    return (
      <Text
        {...labelConfig}
        className={props.singular ? "shrink grow" : undefined}
      >
        {props.text}
      </Text>
    );
  }

  function Supporting(props: { text?: string }) {
    return <Text {...supportingConfig}>{props.text}</Text>;
  }

  return function TextStack(props: TextStackProps) {
    if (!props.supporting) return <Label text={props.label} singular />;
    return (
      <View className="shrink grow">
        <Label text={props.label} />
        <Supporting text={props.supporting} />
      </View>
    );
  };
}

export const TextStack = createTextStack({
  supportingConfig: { muted: true },
});
