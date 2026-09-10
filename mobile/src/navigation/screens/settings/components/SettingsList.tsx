// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext, use } from "react";
import { View } from "react-native";

import { IS_DEV } from "~/env";

import { cn } from "~/lib/style";
import { Divider as Separator } from "~/components/Divider";
import { Card } from "~/components/next/base/card";
import type { SupportedIconName } from "~/components/next/base/icon";
import { Icon } from "~/components/next/base/icon";
import { Ripple } from "~/components/next/base/ripple";
import { createSlottedComponent } from "~/components/next/base/slotted";
import { TextStack } from "~/components/next/blocks/text-stack";

const HasIconContext = createContext(true);

const ItemBase = createSlottedComponent({
  Wrapper: Ripple,
  Content: TextStack,
});

export function Container(props: {
  children: React.ReactNode;
  hasIcon?: boolean;
}) {
  return (
    <HasIconContext value={props.hasIcon ?? true}>
      <Card padding={false}>{props.children}</Card>
    </HasIconContext>
  );
}

export function Divider() {
  const hasIcon = use(HasIconContext);
  return <Separator className={cn("mx-4 -my-px", hasIcon && "ml-14")} />;
}

interface ItemBaseProps extends Omit<
  React.ComponentProps<typeof ItemBase>,
  "Leading"
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
    <ItemBase
      {...props}
      Leading={hasIcon ? <Icon name={iconName ?? "blur-on"} /> : undefined}
      className={cn("min-h-16 p-4 disabled:opacity-25", className)}
    />
  );
}

export function FunctionIndicator({
  intent = "internal",
}: {
  intent?: "internal" | "external";
}) {
  return (
    <View className="size-8 items-center justify-center rounded-full bg-inverseSurface">
      <Icon
        name={intent === "internal" ? "arrow-right-alt" : "call-made"}
        color="inverseOnSurface"
      />
    </View>
  );
}
