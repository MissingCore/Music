// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";
import { View } from "react-native";
import { useEqualizerSettings } from "react-native-audio-browser";

import { useEqualizerStore } from "../core/store";
import { toggleEQ, setEQPreset } from "../core/actions";

import { cn } from "~/lib/style";
import { RadioChipField } from "~/components/Form/Radio";
import { SegmentedList } from "~/components/List/Segmented";
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
        labelText="feat.equalizer.title"
        onPress={toggleEQ}
        Trailing={<Switch enabled={isEQEnabled} />}
      />
      <SegmentedList.CustomItem className="p-4">
        <View
          needsOffscreenAlphaCompositing={!isEQEnabled}
          renderToHardwareTextureAndroid={!isEQEnabled}
          className={cn("gap-4", { "opacity-25": !isEQEnabled })}
        >
          <EQGraph points={eqDataPoints} />

          <View className="flex-row justify-evenly gap-2 rtl:flex-row-reverse">
            {currEQ?.bandLevels.map((level, index) => (
              <FrequencySlider
                key={`${currEQ.activePreset}_${index}`}
                bandIndex={index}
                value={level}
                disabled={activePreset !== "Custom" || !currEQ.enabled}
              />
            ))}
          </View>

          <RadioChipField>
            {eqPresets.map((preset) => (
              <RadioChipField.Item
                key={preset}
                labelKey={`feat.equalizer.extra.${preset}`}
                selected={activePreset === preset}
                onSelect={() => setEQPreset(preset)}
                disabled={!currEQ?.enabled}
              />
            ))}
          </RadioChipField>
        </View>
      </SegmentedList.CustomItem>
    </SegmentedList>
  );
}
