// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { TText } from "~/components/next/base/typography";
import { NumericInput } from "~/components/Form/Input";

export function MinDurationSheet(props: { ref: SheetRef }) {
  const { t } = useTranslation();
  const minSeconds = usePreferenceStore((s) => s.minSeconds);
  const [newValue, setNewValue] = useState<string | undefined>();

  const onUpdate = useCallback((value: string | undefined) => {
    const asNum = Number(value);
    // Validate that it's a positive integer.
    if (!Number.isInteger(asNum) || asNum < 0) return;
    PreferenceSetters.setMinSeconds(asNum);
  }, []);

  useEffect(() => {
    const subscription = Keyboard.addListener(
      "keyboardDidHide",
      // Update value when we close the keyboard.
      () => onUpdate(newValue),
    );
    return () => subscription.remove();
  }, [newValue, onUpdate]);

  return (
    <Sheet ref={props.ref}>
      <Sheet.Header label={t("feat.minTrackDuration.title")}>
        <TText textKey="feat.minTrackDuration.description" muted size="sm" />
      </Sheet.Header>

      <NumericInput
        defaultValue={`${minSeconds}`}
        maxLength={2} // Max out at 99 seconds.
        onChangeText={(text) => setNewValue(text)}
        className="mx-auto mt-6 w-full max-w-[50%] border-b border-outline text-center"
        forSheet
      />
    </Sheet>
  );
}
