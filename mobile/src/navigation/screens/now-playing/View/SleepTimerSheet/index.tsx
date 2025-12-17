import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable, View } from "react-native";

import { Check } from "~/resources/icons/Check";
import { useSleepTimerStore } from "./store";

import { Colors } from "~/constants/Styles";
import { cn } from "~/lib/style";
import { wait } from "~/utils/promise";
import { Button } from "~/components/Form/Button";
import { NumericInput } from "~/components/Form/Input";
import { Sheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";
import { deferInitialRender } from "../../../../components/DeferredRender";

/** Allows the user to set a time when the music will stop playing. */
export const SleepTimerSheet = deferInitialRender(
  function SleepTimerSheet(props: { sheetRef: TrueSheetRef }) {
    const { t } = useTranslation();
    const sleepTimerLength = useSleepTimerStore((s) => s.duration);
    const extendTimer = useSleepTimerStore((s) => s.extension);
    const toggleExtension = useSleepTimerStore((s) => s.toggleExtension);
    const endAt = useSleepTimerStore((s) => s.endAt);
    const createTimer = useSleepTimerStore((s) => s.create);
    const clearTimer = useSleepTimerStore((s) => s.clear);
    const [minutes, setMinutes] = useState(`${sleepTimerLength}`);

    const hasTimer = endAt !== null;

    const endString = useMemo(() => {
      if (endAt === null) return;
      return new Date(endAt).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "numeric",
      });
    }, [endAt]);

    const onSubmit = async () => {
      const asNum = Number(minutes);
      // Validate that it's a positive integer.
      if (!Number.isInteger(asNum) || asNum <= 0) return;
      Keyboard.dismiss();
      await wait(1);
      createTimer(asNum);
    };

    return (
      <Sheet ref={props.sheetRef} titleKey="feat.sleepTimer.title">
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

        <Pressable
          onPress={toggleExtension}
          disabled={hasTimer}
          className="mx-auto flex-row items-center gap-2 disabled:opacity-25"
        >
          <View
            className={cn(
              "size-6 items-center justify-center rounded-sm border border-onSurface",
              {
                "border-red bg-red": extendTimer,
                "border-red/25": hasTimer && extendTimer,
              },
            )}
          >
            {extendTimer ? <Check size={20} color={Colors.neutral100} /> : null}
          </View>
          <TStyledText
            dim
            textKey="feat.sleepTimer.extra.extend"
            className="text-sm"
          />
        </Pressable>

        <Button
          onPress={hasTimer ? clearTimer : onSubmit}
          className="rounded-full"
        >
          <StyledText className="text-center" bold>
            {t(hasTimer ? "form.clear" : "feat.sleepTimer.extra.start")}
          </StyledText>
        </Button>
      </Sheet>
    );
  },
);
