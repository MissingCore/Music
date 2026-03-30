import type { ParseKeys } from "i18next";
import { useMemo } from "react";
import { View } from "react-native";
import { useEqualizerSettings } from "react-native-audio-browser";

import { useEqualizerStore } from "~/modules/equalizer/core/store";
import { toggleEQ, setEQPreset } from "~/modules/equalizer/core/actions";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { Pressable } from "~/components/Base/Pressable";
import { Button } from "~/components/Form/Button";
import { TStyledText } from "~/components/Typography/StyledText";
import { Switch } from "~/components/UI/Switch";
import { EQGraph } from "~/modules/equalizer/components/EQGraph";
import { FrequencySlider } from "~/modules/equalizer/components/FrequencySlider";

export default function EqualizerSettings() {
  const eqFreqs = useEqualizerStore((s) => s.defaultFrequencies);
  const eqPresets = useEqualizerStore((s) => s.defaultPresets);
  const activePreset = useEqualizerStore((s) => s.preset);

  const currEQ = useEqualizerSettings();

  const eqDataPoints = useMemo(
    () =>
      eqFreqs.map((freq, index) => ({
        x: freq,
        y: currEQ?.bandLevels[index] ?? 0,
      })),
    [eqFreqs, currEQ?.bandLevels],
  );

  return (
    <>
      <ScreenOptions
        headerRight={() => (
          <Pressable
            onPress={toggleEQ}
            className="size-10 items-center justify-center"
          >
            <Switch enabled={Boolean(currEQ?.enabled)} />
          </Pressable>
        )}
      />
      <ListLayout>
        <EQGraph points={eqDataPoints} />

        <View
          style={{ flexDirection: OnRTL.decide("row-reverse", "row") }}
          className="justify-evenly"
        >
          {currEQ?.bandLevels.map((level, index) => (
            <FrequencySlider
              key={`${currEQ.activePreset}_${index}`}
              bandIndex={index}
              value={level}
              disabled={activePreset !== "Custom"}
            />
          ))}
        </View>

        <View className="flex-row flex-wrap gap-2">
          {eqPresets.map((preset) => {
            const isActive = activePreset === preset;
            return (
              <Button
                key={preset}
                onPress={() => setEQPreset(preset)}
                className={cn("min-h-auto rounded-full py-2", {
                  "bg-primary active:bg-primaryDim": isActive,
                })}
              >
                <TStyledText
                  textKey={`feat.equalizer.extra.${preset}` as ParseKeys}
                  className={cn("text-xs", { "text-onPrimary": isActive })}
                />
              </Button>
            );
          })}
        </View>
      </ListLayout>
    </>
  );
}
