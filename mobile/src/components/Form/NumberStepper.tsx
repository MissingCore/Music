// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { FilledIconButton } from "./Button/Icon";
import { Em } from "../Typography/StyledText";

export const NumberStepper = memo(function NumberStepper({
  value,
  onChange,
  ...props
}: {
  value: number;
  onChange: (step: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const { t } = useTranslation();

  const step = props.step !== undefined ? Math.abs(props.step) : 1;

  const decrementOnChange = useCallback(
    () => onChange(-step),
    [onChange, step],
  );
  const incrementOnChange = useCallback(() => onChange(step), [onChange, step]);

  return (
    <View className="flex-row items-center gap-2">
      <FilledIconButton
        icon="remove"
        accessibilityLabel={t("template.entryRemove", {
          name: t("plural.second", { count: 1 }),
        })}
        onPress={decrementOnChange}
        disabled={props.min !== undefined ? value <= props.min : undefined}
        className="rounded-sm"
        size="xs"
      />
      <Em className="min-w-8 text-center text-sm">
        {value}
        {props.suffix}
      </Em>
      <FilledIconButton
        icon="add"
        accessibilityLabel={t("template.entryAdd", {
          name: t("plural.second", { count: 1 }),
        })}
        onPress={incrementOnChange}
        disabled={props.max !== undefined ? value >= props.max : undefined}
        className="rounded-sm"
        size="xs"
      />
    </View>
  );
});
