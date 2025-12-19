import type { ParseKeys } from "i18next";
import { useCallback, useEffect, useState } from "react";
import { Keyboard } from "react-native";

import { Sheet } from "./index";
import type { TrueSheetRef } from "./useSheetRef";
import { NumericInput } from "../Form/Input";
import { TStyledText } from "../Typography/StyledText";

interface NumericSheetProps {
  ref: TrueSheetRef;
  titleKey: ParseKeys;
  descriptionKey: ParseKeys;
  value: number;
  setValue: (newValue: number) => void;
}

export function NumericSheet(props: NumericSheetProps) {
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
    <Sheet ref={props.ref} titleKey={props.titleKey}>
      <TStyledText
        textKey={props.descriptionKey}
        className="text-center text-sm"
        dim
      />
      <NumericInput
        defaultValue={`${props.value}`}
        onChangeText={(text) => setNewValue(text)}
        className="mx-auto mb-2 w-full max-w-1/2 border-b border-foreground/60 text-center"
      />
    </Sheet>
  );
}
