// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";

import { cn } from "~/lib/style";
import { Card } from "../base/card";
import type { Intent } from "../base/theming";
import { Text, TText } from "../base/typography";

interface ChipProps {
  intent?: Intent;
  label?: ParseKeys;
  labelText?: string;
  pill?: boolean;
}

export function Chip({ intent, label, labelText, pill }: ChipProps) {
  const textProps = { intent, size: "xs" } as const;
  return (
    <Card
      intent={intent}
      padding={false}
      className={cn("rounded-sm px-3 py-1", pill && "rounded-full")}
    >
      {label ? (
        <TText textKey={label} {...textProps} />
      ) : (
        <Text {...textProps}>{labelText}</Text>
      )}
    </Card>
  );
}
