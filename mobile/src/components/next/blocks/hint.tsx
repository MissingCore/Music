// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { cn, cva } from "~/lib/style";
import { Icon } from "../base/icon";
import { Text } from "../base/typography";
import { baseContainerStyle } from "../base/styles";

const hintStyle = cva({
  composes: [baseContainerStyle],
  base: "flex-row items-center gap-3 rounded-lg p-3",
  defaultVariants: { outline: true },
});

export function Hint(props: { hint: string | string[]; className?: string }) {
  return (
    <View className={hintStyle({ className: cn(props.className) })}>
      <Icon name="info" size={20} color="onSurfaceVariant" />
      <Text muted className="shrink grow">
        {Array.isArray(props.hint) ? props.hint.join("\n\n") : props.hint}
      </Text>
    </View>
  );
}
