import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, View } from "react-native";

import { useSleepTimerStore } from "./SleepTimer/store";

import { wait } from "~/utils/promise";
import { Button } from "~/components/Form/Button";
import { NumericInput } from "~/components/Form/Input";
import type { TrueSheetRef } from "~/components/Sheet";
import { Sheet } from "~/components/Sheet";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

/** Allows the user to set a time when the music will stop playing. */
export function SleepTimerSheet(props: { sheetRef: TrueSheetRef }) {
  const { t } = useTranslation();
  const sleepTimerLength = useSleepTimerStore((state) => state.duration);
  const endAt = useSleepTimerStore((state) => state.endAt);
  const createTimer = useSleepTimerStore((state) => state.create);
  const clearTimer = useSleepTimerStore((state) => state.clear);
  const [minutes, setMinutes] = useState(`${sleepTimerLength}`);

  const hasTimer = endAt !== null;

  const endString = useMemo(() => {
    if (endAt === null) return;
    return new Date(endAt).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "numeric",
    });
  }, [endAt]);

  const onSubmit = useCallback(async () => {
    const asNum = Number(minutes);
    // Validate that it's a positive integer.
    if (!Number.isInteger(asNum) || asNum <= 0) return;
    Keyboard.dismiss();
    await wait(1);
    createTimer(asNum);
  }, [createTimer, minutes]);

  return (
    <Sheet
      ref={props.sheetRef}
      titleKey="feat.sleepTimer.title"
      contentContainerClassName="gap-4"
    >
      <TStyledText
        dim
        textKey="feat.sleepTimer.description"
        className="text-center text-sm"
      />
      <View pointerEvents={hasTimer ? "none" : "auto"}>
        <NumericInput
          defaultValue={`${sleepTimerLength}`}
          editable={!hasTimer}
          onChangeText={(text) => setMinutes(text)}
          className="mx-auto w-full max-w-[50%] border-b border-foreground/60 text-center"
        />
      </View>
      {hasTimer ? (
        <StyledText dim center>
          {t("feat.sleepTimer.extra.stopTime", { time: endString })}
        </StyledText>
      ) : null}

      <Button
        onPress={hasTimer ? clearTimer : onSubmit}
        className="rounded-full"
      >
        <StyledText>
          {t(hasTimer ? "form.clear" : "feat.sleepTimer.extra.start")}
        </StyledText>
      </Button>
    </Sheet>
  );
}
