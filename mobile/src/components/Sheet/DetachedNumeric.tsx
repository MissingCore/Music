import type { ParseKeys } from "i18next";
import { useCallback, useEffect, useState } from "react";
import { Keyboard } from "react-native";

import { DetachedSheet } from "./Detached";
import type { TrueSheetRef } from "./useSheetRef";
import { NumericInput } from "../Form/Input";
import { TStyledText } from "../Typography/StyledText";

interface SheetProps {
  ref: TrueSheetRef;
  titleKey: ParseKeys;
  descriptionKey?: ParseKeys;
  value: number;
  setValue: (newValue: number) => void;
}

export function DetachedNumericSheet(props: SheetProps) {
  const [newValue, setNewValue] = useState<string | undefined>();

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
      {props.descriptionKey ? (
        <TStyledText textKey={props.descriptionKey} dim className="text-sm" />
      ) : null}
      <NumericInput
        defaultValue={`${props.value}`}
        onChangeText={(text) => setNewValue(text)}
        className="mx-auto w-full max-w-[50%] border-b border-outline text-center"
        forSheet
      />
    </DetachedSheet>
  );
}
