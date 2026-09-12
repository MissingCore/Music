// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { use } from "react";

import { cn } from "~/lib/style";
import type { Intent } from "~/components/next/base/context";
import {
  getIntentColor,
  ThemeIntentContext,
} from "~/components/next/base/context";
import { Card } from "~/components/next/base/card";
import { Divider as Separator } from "~/components/next/base/divider";
import type { SupportedIconName } from "~/components/next/base/icon";
import { Icon } from "~/components/next/base/icon";
import { Ripple } from "~/components/next/base/ripple";
import { createSlottedComponent } from "~/components/next/base/slotted";
import { TextStack } from "~/components/next/blocks/text-stack";

const BaseItem = createSlottedComponent({
  Wrapper: Ripple,
  Content: TextStack,
});

export function Container(props: {
  children: React.ReactNode;
  theme?: Intent;
  className?: string;
}) {
  return (
    <ThemeIntentContext value={props.theme ?? "unset"}>
      <Card padding={false} className={cn("w-full", props.className)}>
        {props.children}
      </Card>
    </ThemeIntentContext>
  );
}

export function Divider({ afterIconItem = true }) {
  return <Separator className={cn("mx-4 -my-px", afterIconItem && "ml-14")} />;
}

interface ItemBaseProps extends Omit<
  React.ComponentProps<typeof BaseItem>,
  "Leading" | "rippleColor"
> {
  iconName?: SupportedIconName;
  hintConfig?: ActionHintProps;
}

export function Item({
  iconName,
  className,
  hintConfig,
  Trailing,
  ...props
}: ItemBaseProps) {
  return (
    <BaseItem
      {...props}
      Leading={iconName ? <Icon name={iconName} /> : undefined}
      Trailing={
        Trailing !== undefined ? Trailing : <ActionHint {...hintConfig} />
      }
      className={cn("min-h-16 p-4", className)}
    />
  );
}

interface ActionHintProps {
  hint?: "internal" | "external";
  size?: "lg";
}

export function ActionHint({ hint = "internal", size }: ActionHintProps) {
  return (
    <Card
      pointerEvents="none"
      inverse
      padding={false}
      className={cn(
        "size-8 items-center justify-center rounded-full rtl:-scale-x-100",
        { "size-12": size === "lg" },
      )}
    >
      <Icon
        name={hint === "internal" ? "arrow-right-alt" : "call-made"}
        color={getIntentColor(use(ThemeIntentContext))}
        size={size === "lg" ? 32 : undefined}
      />
    </Card>
  );
}
