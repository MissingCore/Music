// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { openLink } from "~/lib/web-browser";
import { Card } from "~/components/next/base/card";
import { Divider as DividerBase } from "~/components/next/base/divider";
import type { SupportedIconName } from "~/components/next/base/icon";
import { Icon } from "~/components/next/base/icon";
import { Ripple } from "~/components/next/base/ripple";
import { Switch } from "~/components/next/base/switch";
import { Text } from "~/components/next/base/typography";
import { TextStack } from "~/components/next/blocks/text-stack";
import type { PressProps } from "~/components/next/primitive/pressable";

export function Group(props: { children: React.ReactNode; label?: string }) {
  const renderedComponent = <Card className="p-0">{props.children}</Card>;

  if (!props.label) return renderedComponent;
  return (
    <View>
      <Text bold size="sm" className="mb-2">
        {props.label}
      </Text>
      {renderedComponent}
    </View>
  );
}

export function Divider({ adjustForIcon = true }) {
  return <DividerBase className={cn("mx-4", adjustForIcon && "ml-14")} />;
}

export function ExternalLinkItem({
  href,
  ...props
}: ItemBaseProps & {
  href: string;
}) {
  return (
    <ItemBase
      {...props}
      onPress={() => openLink(href)}
      Trailing={<Icon name={`north-${OnRTL.decide("west", "east")}`} />}
    />
  );
}

export function Item(props: ItemBaseProps & { onPress: VoidFunction }) {
  return (
    <ItemBase
      {...props}
      Trailing={<Icon name={OnRTL.decide("west", "east")} />}
    />
  );
}

export function ToggleItem({
  onToggle,
  enabled,
  ...props
}: ItemBaseProps & {
  onToggle: VoidFunction;
  enabled: boolean;
  disabled?: boolean;
}) {
  return (
    <ItemBase
      {...props}
      onPress={onToggle}
      Trailing={<Switch enabled={enabled} />}
    />
  );
}

//#region Internal Helpers
interface ItemBaseProps {
  icon: SupportedIconName;
  label: string;
  supporting?: string;
}

function ItemBase({
  icon,
  label,
  supporting,
  Trailing,
  ...props
}: ItemBaseProps & PressProps & { Trailing: React.ReactNode }) {
  return (
    <Ripple
      {...props}
      className="flex-row items-center gap-4 p-4 disabled:opacity-25"
    >
      <Icon name={icon} size={24} />
      <TextStack label={label} supporting={supporting} />
      {Trailing}
    </Ripple>
  );
}
//#endregion
