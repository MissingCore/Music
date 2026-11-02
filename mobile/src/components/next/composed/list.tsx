// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { openLink } from "~/lib/web-browser";
import { Card } from "../base/card";
import { Divider as DividerBase } from "../base/divider";
import type { SupportedIconName } from "../base/icon";
import { Icon } from "../base/icon";
import { Ripple } from "../base/ripple";
import { Switch } from "../base/switch";
import { Text } from "../base/typography";
import { TextStack } from "../blocks/text-stack";
import type { PressableProps } from "../primitive/pressable";

export function Group(props: { children: React.ReactNode; label?: string }) {
  const renderedComponent = <Card className="p-0">{props.children}</Card>;

  if (!props.label) return renderedComponent;
  return (
    <View>
      <Text intent="em" className="mb-2">
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
}: ItemBaseProps & { href: string }) {
  return (
    <ItemBase
      {...props}
      role="link"
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
}: ItemBaseProps & { onToggle: VoidFunction; enabled: boolean }) {
  return (
    <ItemBase
      {...props}
      role="switch"
      aria-checked={enabled}
      aria-disabled={props.disabled}
      onPress={onToggle}
      Trailing={<Switch enabled={enabled} />}
    />
  );
}

//#region Internal Helpers
interface ItemBaseProps {
  /** The design is icon-first (ie: we assume an icon is provided). */
  icon?: SupportedIconName;
  label: string;
  supporting?: string;
  disabled?: boolean;
}

function ItemBase({
  icon,
  label,
  supporting,
  Trailing,
  ...props
}: ItemBaseProps & PressableProps & { Trailing: React.ReactNode }) {
  return (
    <Ripple
      {...props}
      className="flex-row items-center gap-4 p-4 disabled:opacity-25"
    >
      {icon ? <Icon name={icon} /> : null}
      <TextStack label={label} supporting={supporting} />
      {Trailing}
    </Ripple>
  );
}
//#endregion
