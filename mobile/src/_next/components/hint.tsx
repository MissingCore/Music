// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { useTheme } from "~/_next/context/theme-context";

import { Icon } from "./icon";
import { Text } from "./typography";

export function Hint(props: { hint: string | string[] }) {
  const { text } = useTheme().colors;
  return (
    <View
      style={{ backgroundColor: text }}
      className="flex-row gap-3 rounded-lg p-3"
    >
      <Icon name="information" size={20} color="background" />
      <Text color="background" className="shrink grow">
        {Array.isArray(props.hint) ? props.hint.join("\n\n") : props.hint}
      </Text>
    </View>
  );
}
