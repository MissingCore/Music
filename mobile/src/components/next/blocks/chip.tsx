// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";

import type { CardVariants } from "../base/card";
import { Card } from "../base/card";
import { Text, TText } from "../base/typography";

interface ChipProps extends Pick<CardVariants, "intent"> {
  label?: ParseKeys;
  labelText?: string;
}

export function Chip({ intent, label, labelText }: ChipProps) {
  const textProps = {
    intent: intent === "muted" ? "unset" : intent,
    size: "xs",
  } as const;
  return (
    <Card intent={intent} padding={false} className="rounded-sm px-3 py-1">
      {label ? (
        <TText textKey={label} {...textProps} />
      ) : (
        <Text {...textProps}>{labelText}</Text>
      )}
    </Card>
  );
}
