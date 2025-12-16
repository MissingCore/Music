import type { ParseKeys } from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, View } from "react-native";

import { DetachedSheet } from "./Detached";
import type { TrueSheetRef } from "./useSheetRef";
import { NumericInput } from "../Form/Input";
import { StyledText, TStyledText } from "../Typography/StyledText";

interface SheetProps {
  ref: TrueSheetRef;
  titleKey: ParseKeys;
  descriptionKey: ParseKeys;
  /** We'll remove the interpolation string. */
  valueLabelKey: ParseKeys;
  value: number;
  setValue: (newValue: number) => void;
}

export function DetachedNumericSheet(props: SheetProps) {
  const { t } = useTranslation();
  const [newValue, setNewValue] = useState<string | undefined>();

  const valueLabel = useMemo(
    () => t(props.valueLabelKey).replace("{{count}}", "").trim(),
    [t, props.valueLabelKey],
  );

  const onUpdate = useCallback(
    (value: string | undefined) => {
      const asNum = Number(value);
      // Validate that it's a positive integer.
      if (!Number.isInteger(asNum) || asNum < 0) return;
      props.setValue(asNum);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.setValue],
  );

  useEffect(() => {
    const subscription = Keyboard.addListener(
      "keyboardDidHide",
      // Update value when we close the keyboard.
      () => onUpdate(newValue),
    );
    return () => subscription.remove();
  }, [newValue, onUpdate]);

  return (
    <DetachedSheet ref={props.ref} titleKey={props.titleKey}>
      <TStyledText textKey={props.descriptionKey} dim className="text-sm" />
      <View className="flex-row items-end gap-2 border-b border-b-foreground/10">
        <NumericInput
          defaultValue={`${props.value}`}
          onChangeText={(text) => setNewValue(text)}
          className="shrink grow"
        />
        <StyledText dim className="text-sm">
          {valueLabel}
        </StyledText>
      </View>
    </DetachedSheet>
  );
}
