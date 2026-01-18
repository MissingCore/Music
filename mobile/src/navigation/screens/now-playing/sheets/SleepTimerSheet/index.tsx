import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard } from "react-native";

import { useSleepTimerStore } from "./store";

import { wait } from "~/utils/promise";
import { ExtendedTButton } from "~/components/Form/Button";
import { ClickwrapCheckbox } from "~/components/Form/Checkbox";
import { NumericInput } from "~/components/Form/Input";
import { DetachedSheet } from "~/components/Sheet/Detached";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

export function SleepTimerSheet(props: { ref: TrueSheetRef }) {
  const { t } = useTranslation();
  const sleepTimerLength = useSleepTimerStore((s) => s.duration);
  const extendTimer = useSleepTimerStore((s) => s.extension);
  const toggleExtension = useSleepTimerStore((s) => s.toggleExtension);
  const endAt = useSleepTimerStore((s) => s.endAt);
  const createTimer = useSleepTimerStore((s) => s.create);
  const clearTimer = useSleepTimerStore((s) => s.clear);
  const [minutes, setMinutes] = useState(`${sleepTimerLength}`);

  const hasTimer = endAt !== null;

  const minutesAsNum = useMemo(() => {
    const asNum = Number(minutes);
    // Validate that it's a positive integer.
    if (!Number.isInteger(asNum) || asNum <= 0) return;
    return asNum;
  }, [minutes]);

  const endString = useMemo(() => {
    if (minutesAsNum === undefined) return "—";
    const estEndTime = endAt ? endAt : Date.now() + minutesAsNum * 60000;
    return new Date(estEndTime).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "numeric",
    });
  }, [endAt, minutesAsNum]);

  const onSubmit = async () => {
    if (minutesAsNum === undefined) return;
    Keyboard.dismiss();
    await wait(1);
    createTimer(minutesAsNum);
  };

  return (
    <DetachedSheet ref={props.ref} titleKey="feat.sleepTimer.title">
      <TStyledText
        textKey="feat.sleepTimer.description"
        dim
        className="text-sm"
      />
      <NumericInput
        pointerEvents={hasTimer ? "none" : "auto"}
        defaultValue={`${sleepTimerLength}`}
        editable={!hasTimer}
        onChangeText={(text) => setMinutes(text)}
        className="mx-auto w-full max-w-1/2 border-b border-outline text-center"
        forSheet
      />
      <StyledText dim>
        {t("feat.sleepTimer.extra.stopTime", { time: endString })}
      </StyledText>
      <ClickwrapCheckbox
        textKey="feat.sleepTimer.extra.extend"
        checked={extendTimer}
        onCheck={toggleExtension}
        disabled={hasTimer}
      />
      <ExtendedTButton
        textKey={hasTimer ? "form.clear" : "feat.sleepTimer.extra.start"}
        onPress={hasTimer ? clearTimer : onSubmit}
        className="rounded-full"
      />
    </DetachedSheet>
  );
}
