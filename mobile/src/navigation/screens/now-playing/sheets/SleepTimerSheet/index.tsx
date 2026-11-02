// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard } from "react-native";
import { scheduleOnRN } from "react-native-worklets";

import { useInForeground } from "~/stores/ListenerState";
import { useSleepTimerStore } from "./store";

import { wait } from "~/utils/promise";
import { Card } from "~/components/next/base/card";
import { Divider } from "~/components/next/base/divider";
import type { SheetRef } from "~/components/next/base/sheet";
import { ScrollableSheet } from "~/components/next/base/sheet";
import { Text, TText } from "~/components/next/base/typography";
import { ActionButton } from "~/components/next/blocks/button-action";
import { ClickwrapCheckbox } from "~/components/next/blocks/checkbox";
import type { LabeledSliderProps } from "~/components/next/blocks/slider-labeled";
import { LabeledSlider } from "~/components/next/blocks/slider-labeled";

export function SleepTimerSheet(props: { ref: SheetRef }) {
  const { t } = useTranslation();
  const sleepTimerLength = useSleepTimerStore((s) => s.duration);
  const extendTimer = useSleepTimerStore((s) => s.extension);
  const toggleExtension = useSleepTimerStore((s) => s.toggleExtension);
  const endAt = useSleepTimerStore((s) => s.endAt);
  const createTimer = useSleepTimerStore((s) => s.create);
  const clearTimer = useSleepTimerStore((s) => s.clear);
  const [stopDrag, setStopDrag] = useState(false);
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

  const sleepTimerDurationSlider = useMemo<LabeledSliderProps>(
    () => ({
      min: 1,
      max: 60,
      initValue: Number(minutes) || 5,
      label: t("feat.modalViewPreference.extra.duration"),
      formatValue: (value) => {
        "worklet";
        return `${value}min`;
      },
      onChange: (value) => {
        "worklet";
        scheduleOnRN(setMinutes, `${value}`);
      },
      onStatusChange: (status) => {
        "worklet";
        scheduleOnRN(setStopDrag, status !== "idle");
      },
    }),
    [t, setStopDrag, minutes],
  );

  return (
    <ScrollableSheet ref={props.ref} draggable={!stopDrag}>
      <Card className="gap-4">
        <TText textKey="feat.sleepTimer.description" size="sm" />
        {hasTimer ? (
          <CountdownTimer endAt={endAt} />
        ) : (
          <LabeledSlider {...sleepTimerDurationSlider} />
        )}
        <Text muted className="-mt-2">
          {t("feat.sleepTimer.extra.stopTime", { time: endString })}
        </Text>
        <Divider />
        <ClickwrapCheckbox
          textKey="feat.sleepTimer.extra.extend"
          checked={extendTimer}
          onCheck={toggleExtension}
          disabled={hasTimer}
          className="-m-4 rounded-none border-0 p-4"
        />
      </Card>
      <ActionButton
        label={t(hasTimer ? "form.clear" : "feat.sleepTimer.extra.start")}
        onPress={hasTimer ? clearTimer : onSubmit}
        intent="inverse"
        className="rounded-full"
      />
    </ScrollableSheet>
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
