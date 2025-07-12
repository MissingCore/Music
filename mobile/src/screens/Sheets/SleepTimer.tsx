import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useSessionStore } from "~/services/SessionStore";

import { Button } from "~/components/Form/Button";
import { NumericInput } from "~/components/Form/Input";
import type { TrueSheetRef } from "~/components/Sheet";
import { Sheet } from "~/components/Sheet";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

/** Allows the user to set a time when the music will stop playing. */
export function SleepTimerSheet(props: { sheetRef: TrueSheetRef }) {
  const { t } = useTranslation();
  const sleepTimerLength = useSessionStore((state) => state.sleepTimerDuration);
  const endAt = useSessionStore((state) => state.sleepTimerEndAt);
  const createSleepTimer = useSessionStore((state) => state.createSleepTimer);
  const clearSleepTimer = useSessionStore((state) => state.clearSleepTimer);
  const [minutes, setMinutes] = useState("5");

  const hasTimer = endAt !== null;

  const endString = useMemo(() => {
    if (endAt === null) return;
    return new Date(endAt).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "numeric",
    });
  }, [endAt]);

  const onSubmit = useCallback(() => {
    const asNum = Number(minutes);
    // Validate that it's a positive integer.
    if (!Number.isInteger(asNum) || asNum <= 0) return;
    createSleepTimer(asNum);
  }, [createSleepTimer, minutes]);

  return (
    <Sheet
      ref={props.sheetRef}
      titleKey="feat.sleepTimer.title"
      // Required to get auto-resizing to work when content height changes.
      // Ref: https://github.com/lodev09/react-native-true-sheet/issues/7
      sizes={["auto", "large"]}
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
        onPress={hasTimer ? clearSleepTimer : onSubmit}
        className="rounded-full"
      >
        <StyledText>
          {t(hasTimer ? "form.clear" : "feat.sleepTimer.extra.start")}
        </StyledText>
      </Button>
    </Sheet>
  );
}
