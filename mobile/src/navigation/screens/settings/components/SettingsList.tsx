// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext, use } from "react";

import { IS_DEV } from "~/env";

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

const HasIconContext = createContext(true);

const BaseItem = createSlottedComponent({
  Wrapper: Ripple,
  Content: TextStack,
});

interface ProviderProps {
  children: React.ReactNode;
  theme?: Intent;
  hasIcon?: boolean;
}

export function Provider(props: ProviderProps) {
  const { theme, hasIcon = true, children } = props;
  return (
    <ThemeIntentContext value={theme ?? "unset"}>
      <HasIconContext value={hasIcon}>{children}</HasIconContext>
    </ThemeIntentContext>
  );
}

export function Container(
  props: ProviderProps & { children: React.ReactNode; className?: string },
) {
  return (
    <Provider theme={props.theme} hasIcon={props.hasIcon}>
      <Card padding={false} className={cn("w-full", props.className)}>
        {props.children}
      </Card>
    </Provider>
  );
}

export function Divider() {
  const hasIcon = use(HasIconContext);
  return <Separator className={cn("mx-4 -my-px", hasIcon && "ml-14")} />;
}

interface ItemBaseProps extends Omit<
  React.ComponentProps<typeof BaseItem>,
  "Leading" | "rippleColor"
> {
  iconName?: SupportedIconName;
}

export function Item({ iconName, className, ...props }: ItemBaseProps) {
  const hasIcon = use(HasIconContext);

  if (IS_DEV) {
    if (hasIcon && !iconName) {
      console.warn(
        `Default \`iconName\` is being used by \`<SettingsList.Item />\`.`,
      );
    }
    if (!hasIcon && iconName) {
      console.warn(
        `Unused \`iconName\` (${iconName}) passed to \`<SettingsList.Item />\`.`,
      );
    }
  }

  return (
    <BaseItem
      {...props}
      Leading={iconName ? <Icon name={iconName} /> : undefined}
      className={cn("min-h-16 p-4", className)}
    />
  );
}

export function ActionHint({
  hint = "internal",
}: {
  hint?: "internal" | "external";
}) {
  return (
    <Card
      inverse
      padding={false}
      className="size-8 items-center justify-center rounded-full rtl:-scale-x-100"
    >
      <Icon
        name={hint === "internal" ? "arrow-right-alt" : "call-made"}
        color={getIntentColor(use(ThemeIntentContext))}
      />
    </Card>
  );
}
