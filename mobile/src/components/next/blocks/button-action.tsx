// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { cn } from "~/lib/style";
import { Button } from "../base/button";
import type { SupportedIconName } from "../base/icon";
import { Icon } from "../base/icon";
import { getIntentOnColor, type Intent } from "../base/styles";
import { Text } from "../base/typography";
import type { PressableProps } from "../primitive/pressable";

interface ActionButtonProps extends Omit<PressableProps, "android_ripple"> {
  label: string;
  supporting?: string;
  intent?: Intent;
  leadingIcon?: SupportedIconName;
  trailingIcon?: SupportedIconName;
  className?: string;
}

export function ActionButton({
  label,
  supporting,
  intent,
  leadingIcon,
  trailingIcon,
  className,
  ...props
}: ActionButtonProps) {
  return (
    <Button {...props} intent={intent} className={cn("gap-2", className)}>
      {leadingIcon && (
        <Icon name={leadingIcon} size={20} color={getIntentOnColor(intent)} />
      )}
      <View className="shrink items-center justify-center">
        <Text numberOfLines={1} intent={intent} bold size="sm">
          {label}
        </Text>
        {supporting ? (
          <Text numberOfLines={1} intent={intent} muted>
            {supporting}
          </Text>
        ) : null}
      </View>
      {trailingIcon && (
        <Icon name={trailingIcon} size={20} color={getIntentOnColor(intent)} />
      )}
    </Button>
  );
}
