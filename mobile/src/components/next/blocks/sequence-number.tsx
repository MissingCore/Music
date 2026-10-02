// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { cn } from "~/lib/style";
import { Text } from "../base/typography";

export function SequenceNumber(props: {
  value: string | number;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "size-14 items-center justify-center overflow-hidden",
        props.className,
      )}
    >
      <Text style={{ fontVariant: ["tabular-nums"] }}>{props.value}</Text>
    </View>
  );
}
