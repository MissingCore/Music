// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard } from "react-native";

import { useInForeground } from "~/stores/ListenerState";
import { useSleepTimerStore } from "./store";

import { wait } from "~/utils/promise";
import { ClickwrapCheckbox } from "~/components/Form/Checkbox";
import { NumericInput } from "~/components/Form/Input";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { Text, TText } from "~/components/next/base/typography";
import { ActionButton } from "~/components/next/blocks/button-action";

export function SleepTimerSheet(props: { ref: SheetRef }) {
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
    // eslint-disable-next-line react-hooks/purity
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
    <Sheet ref={props.ref}>
      <Sheet.Header label={t("feat.sleepTimer.title")} />

      <TText textKey="feat.sleepTimer.description" muted size="sm" />
      {hasTimer ? (
        <CountdownTimer endAt={endAt} />
      ) : (
        <NumericInput
          defaultValue={`${sleepTimerLength}`}
          onChangeText={(text) => setMinutes(text)}
          maxLength={3} // Max out at 999 minutes (~16.5 hours).
          className="mx-auto w-full max-w-1/2 border-b border-outline text-center"
          forSheet
        />
      )}
      <Text muted>
        {t("feat.sleepTimer.extra.stopTime", { time: endString })}
      </Text>
      <ClickwrapCheckbox
        textKey="feat.sleepTimer.extra.extend"
        checked={extendTimer}
        onCheck={toggleExtension}
        disabled={hasTimer}
      />
      <ActionButton
        label={t(hasTimer ? "form.clear" : "feat.sleepTimer.extra.start")}
        onPress={hasTimer ? clearTimer : onSubmit}
        className="rounded-full"
      />
    </Sheet>
  );
}

function CountdownTimer({ endAt }: { endAt: number }) {
  const inForeground = useInForeground();

  const getInitialTimerState = useMemo(() => {
    return () => {
      let second = Math.max(0, Math.floor((endAt - Date.now()) / 1000));
      const hour = Math.floor(second / 3600);
      second -= hour * 3600;
      const minute = Math.floor(second / 60);
      second -= minute * 60;
      return { hour, minute, second };
    };
  }, [endAt]);

  const [timer, setTimer] = useState(getInitialTimerState);

  useEffect(() => {
    if (!inForeground) return;
    const interval = setInterval(() => setTimer(getInitialTimerState()), 1000);
    return () => clearInterval(interval);
  }, [inForeground, getInitialTimerState]);

  return (
    <Text
      accent
      style={{ fontVariant: ["tabular-nums"] }}
      className="text-center text-5xl"
    >{`${String(timer.hour).padStart(2, "0")} : ${String(timer.minute).padStart(2, "0")} : ${String(timer.second).padStart(2, "0")}`}</Text>
  );
}
