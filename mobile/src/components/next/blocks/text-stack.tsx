// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import { View } from "react-native";

import type { TextVariants } from "../base/typography";
import { Text, TText } from "../base/typography";

interface TextStackProps {
  label: ParseKeys;
  /** Prioritized over `descriptionText`. */
  description?: ParseKeys;
  descriptionText?: string;
}

/** Generates a React Component that is built to the specified configurations. */
export function createTextStack(args: {
  labelConfig?: TextVariants;
  descriptionConfig?: TextVariants;
  /** If `numberOfLines = 1` is applied to both fields. */
  clampText?: boolean;
}) {
  const additionalProps = {
    numberOfLines: args.clampText ? 1 : undefined,
  };

  const labelConfig = { ...args.labelConfig, ...additionalProps };
  const descriptionConfig = { ...args.descriptionConfig, ...additionalProps };

  function Label(props: { textKey: ParseKeys; singular?: boolean }) {
    return (
      <TText
        {...labelConfig}
        textKey={props.textKey}
        className={props.singular ? "shrink grow" : undefined}
      />
    );
  }

  function Description(props: { textKey?: ParseKeys; text?: string }) {
    if (props.textKey)
      return <TText {...descriptionConfig} textKey={props.textKey} />;
    return <Text {...descriptionConfig}>{props.text}</Text>;
  }

  return function TextStack(props: TextStackProps) {
    if (!props.description && !props.descriptionText)
      return <Label textKey={props.label} singular />;
    return (
      <View className="shrink grow">
        <Label textKey={props.label} />
        <Description textKey={props.description} text={props.descriptionText} />
      </View>
    );
  };
}

export const TextStack = createTextStack({
  descriptionConfig: { muted: true },
});
