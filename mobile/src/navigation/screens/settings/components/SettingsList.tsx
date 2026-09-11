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
import {
  createTextStack,
  TextStack,
} from "~/components/next/blocks/text-stack";

type Theme = "base" | "muted" | "secondary";

const ThemeContext = createContext<Exclude<Theme, "muted">>("base");
const HasIconContext = createContext(true);

const ThemeConfig = {
  base: {
    Item: createSlottedComponent({
      Wrapper: Ripple,
      Content: TextStack,
    }),
    colors: {
      icon: undefined,
      iconInverse: "inverseOnSurface",
      ripple: undefined,
    },
    bgColors: {
      divider: "bg-outlineVariant",
      inverse: "bg-inverseSurface",
    },
  },
  secondary: {
    Item: createSlottedComponent({
      Wrapper: Ripple,
      Content: createTextStack({
        labelConfig: { intent: "secondary" },
        supportingConfig: { intent: "secondary", muted: true },
      }),
    }),
    colors: {
      icon: "onSecondary",
      iconInverse: "secondary",
      ripple: "secondaryDim",
    },
    bgColors: {
      divider: "bg-secondaryDim",
      inverse: "bg-onSecondary",
    },
  },
} as const;

interface ProviderProps {
  children: React.ReactNode;
  theme?: Theme;
  hasIcon?: boolean;
}

export function Provider(props: ProviderProps) {
  const { theme = "base", hasIcon = true, children } = props;
  return (
    <ThemeContext value={theme !== "muted" ? theme : "base"}>
      <HasIconContext value={hasIcon}>{children}</HasIconContext>
    </ThemeContext>
  );
}

export function Container(
  props: ProviderProps & { children: React.ReactNode; className?: string },
) {
  return (
    <Provider theme={props.theme} hasIcon={props.hasIcon}>
      <Card
        intent={props.theme !== "base" ? props.theme : undefined}
        padding={false}
        className={cn("w-full", props.className)}
      >
        {props.children}
      </Card>
    </Provider>
  );
}

export function Divider() {
  const { bgColors } = ThemeConfig[use(ThemeContext)];
  const hasIcon = use(HasIconContext);
  return (
    <Separator
      className={cn("mx-4 -my-px", bgColors.divider, hasIcon && "ml-14")}
    />
  );
}

interface ItemBaseProps extends Omit<
  React.ComponentProps<(typeof ThemeConfig)["base"]["Item"]>,
  "Leading" | "rippleColor"
> {
  iconName?: SupportedIconName;
}

export function Item({ iconName, className, ...props }: ItemBaseProps) {
  const { Item, colors } = ThemeConfig[use(ThemeContext)];
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
    <Item
      {...props}
      rippleColor={colors.ripple}
      Leading={
        hasIcon ? (
          <Icon name={iconName ?? "blur-on"} color={colors.icon} />
        ) : undefined
      }
      className={cn("min-h-16 p-4", className)}
    />
  );
}

export function ActionHint({
  hint = "internal",
}: {
  hint?: "internal" | "external";
}) {
  const { bgColors, colors } = ThemeConfig[use(ThemeContext)];
  return (
    <View
      className={cn(
        "size-8 items-center justify-center rounded-full bg-inverseSurface rtl:-scale-x-100",
        bgColors.inverse,
      )}
    >
      <Icon
        name={hint === "internal" ? "arrow-right-alt" : "call-made"}
        color={colors.iconInverse}
      />
    </View>
  );
}
