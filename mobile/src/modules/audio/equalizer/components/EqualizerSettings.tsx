import type { ParseKeys } from "i18next";
import { useMemo } from "react";
import { View } from "react-native";
import { useEqualizerSettings } from "react-native-audio-browser";

import { useEqualizerStore } from "../core/store";
import { toggleEQ, setEQPreset } from "../core/actions";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { Button } from "~/components/Form/Button";
import { SegmentedList } from "~/components/List/Segmented";
import { TStyledText } from "~/components/Typography/StyledText";
import { Switch } from "~/components/UI/Switch";
import { EQGraph } from "../components/EQGraph";
import { FrequencySlider } from "../components/FrequencySlider";

export function EqualizerSettings() {
  const eqFreqs = useEqualizerStore((s) => s.defaultFrequencies);
  const eqPresets = useEqualizerStore((s) => s.defaultPresets);
  const activePreset = useEqualizerStore((s) => s.preset);

  const currEQ = useEqualizerSettings();
  const isEQEnabled = Boolean(currEQ?.enabled);

  const eqDataPoints = useMemo(
    () =>
      eqFreqs.map((freq, index) => ({
        x: freq,
        y: currEQ?.bandLevels[index] ?? 0,
      })),
    [eqFreqs, currEQ?.bandLevels],
  );

  return (
    <SegmentedList>
      <SegmentedList.Item
        labelTextKey="feat.equalizer.title"
        onPress={toggleEQ}
        RightElement={<Switch enabled={isEQEnabled} />}
      />
      <SegmentedList.CustomItem className="p-4">
        <View
          needsOffscreenAlphaCompositing={!isEQEnabled}
          renderToHardwareTextureAndroid={!isEQEnabled}
          className={cn("gap-4", { "opacity-25": !isEQEnabled })}
        >
          <EQGraph points={eqDataPoints} />

          <View
            style={{ flexDirection: OnRTL.decide("row-reverse", "row") }}
            className="justify-evenly gap-2"
          >
            {currEQ?.bandLevels.map((level, index) => (
              <FrequencySlider
                key={`${currEQ.activePreset}_${index}`}
                bandIndex={index}
                value={level}
                disabled={activePreset !== "Custom" || !currEQ.enabled}
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
                  disabled={!currEQ?.enabled}
                  className={cn(
                    "min-h-auto rounded-full bg-surfaceContainerLow py-2 active:bg-surfaceContainer disabled:opacity-100",
                    { "bg-primary active:bg-primaryDim": isActive },
                  )}
                >
                  <TStyledText
                    textKey={`feat.equalizer.extra.${preset}` as ParseKeys}
                    className={cn("text-xs", { "text-onPrimary": isActive })}
                  />
                </Button>
              );
            })}
          </View>
        </View>
      </SegmentedList.CustomItem>
    </SegmentedList>
  );
}
