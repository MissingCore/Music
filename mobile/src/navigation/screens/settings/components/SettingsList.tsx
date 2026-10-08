// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { cn } from "~/lib/style";
import { openLink } from "~/lib/web-browser";
import { Card } from "~/components/next/base/card";
import { Divider as DividerBase } from "~/components/next/base/divider";
import type { SupportedIconName } from "~/components/next/base/icon";
import { Icon } from "~/components/next/base/icon";
import { Ripple } from "~/components/next/base/ripple";
import { Switch } from "~/components/next/base/switch";
import { TextStack } from "~/components/next/blocks/text-stack";
import type { PressProps } from "~/components/next/primitive/pressable";

export function Container(props: { children: React.ReactNode }) {
  return <Card className="p-0">{props.children}</Card>;
}

export function Divider({ adjustForIcon = true }) {
  return <DividerBase className={cn("mx-4", adjustForIcon && "ml-14")} />;
}

export function ExternalLinkListItem({
  href,
  ...props
}: ListItemBaseProps & {
  href: string;
}) {
  return (
    <ListItemBase
      {...props}
      onPress={() => openLink(href)}
      Trailing={
        <View className="rtl:-scale-x-100">
          <Icon name="call-made" />
        </View>
      }
    />
  );
}

export function ListItem(props: ListItemBaseProps & { onPress: VoidFunction }) {
  return (
    <ListItemBase
      {...props}
      Trailing={
        <View className="rtl:-scale-x-100">
          <Icon name="east" size={24} />
        </View>
      }
    />
  );
}

export function SwitchListItem({
  onToggle,
  enabled,
  ...props
}: ListItemBaseProps & {
  onToggle: VoidFunction;
  enabled: boolean;
  disabled?: boolean;
}) {
  return (
    <ListItemBase
      {...props}
      onPress={onToggle}
      Trailing={<Switch enabled={enabled} />}
    />
  );
}

//#region Internal Helpers
interface ListItemBaseProps {
  icon: SupportedIconName;
  label: string;
  supporting?: string;
}

function ListItemBase({
  icon,
  label,
  supporting,
  Trailing,
  ...props
}: ListItemBaseProps & PressProps & { Trailing: React.ReactNode }) {
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
