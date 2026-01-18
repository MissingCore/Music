import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Add } from "~/resources/icons/Add";
import { Remove } from "~/resources/icons/Remove";

import { FilledIconButton } from "./Button/Icon";
import { StyledText } from "../Typography/StyledText";

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

  const step = useMemo(
    () => (props.step !== undefined ? Math.abs(props.step) : 1),
    [props.step],
  );

  const decrementLabel = useMemo(
    () => t("template.entryRemove", { name: t("plural.second", { count: 1 }) }),
    [t],
  );
  const decrementOnChange = useCallback(
    () => onChange(-step),
    [onChange, step],
  );

  const incrementLabel = useMemo(
    () => t("template.entryRemove", { name: t("plural.second", { count: 1 }) }),
    [t],
  );
  const incrementOnChange = useCallback(() => onChange(step), [onChange, step]);

  return (
    <View className="flex-row items-center gap-2">
      <FilledIconButton
        Icon={Remove}
        accessibilityLabel={decrementLabel}
        onPress={decrementOnChange}
        disabled={props.min !== undefined ? value <= props.min : undefined}
        className="rounded-xs"
        size="xs"
      />
      <StyledText bold className="min-w-8 text-center text-sm">
        {value}
        {props.suffix}
      </StyledText>
      <FilledIconButton
        Icon={Add}
        accessibilityLabel={incrementLabel}
        onPress={incrementOnChange}
        disabled={props.max !== undefined ? value >= props.max : undefined}
        className="rounded-xs"
        size="xs"
      />
    </View>
  );
});
