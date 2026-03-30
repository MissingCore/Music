import type { ParseKeys } from "i18next";
import { useMemo } from "react";
import { View } from "react-native";
import AudioBrowser, { useEqualizerSettings } from "react-native-audio-browser";

import { ListLayout } from "~/navigation/layouts/ListLayout";

import { cn } from "~/lib/style";
import { Button } from "~/components/Form/Button";
import { TStyledText } from "~/components/Typography/StyledText";
import { EQGraph } from "~/modules/equalizer/components/EQGraph";

export default function EqualizerSettings() {
  const eqSettings = useEqualizerSettings();

  const dataPoints = useMemo(() => {
    if (!eqSettings?.centerBandFrequencies) return [];
    return eqSettings.centerBandFrequencies.map((freq, index) => ({
      x: freq,
      y: eqSettings.bandLevels[index]!,
    }));
  }, [eqSettings?.bandLevels, eqSettings?.centerBandFrequencies]);

  const eqRange = useMemo(() => {
    if (!eqSettings?.lowerBandLevelLimit) return 0;
    return Math.max(
      Math.abs(eqSettings.lowerBandLevelLimit),
      eqSettings.upperBandLevelLimit,
    );
  }, [eqSettings?.lowerBandLevelLimit, eqSettings?.upperBandLevelLimit]);

  return (
    <ListLayout>
      <EQGraph bound={eqRange} points={dataPoints} />

      <View className="flex-row flex-wrap gap-2">
        {eqSettings?.presets.map((preset) => {
          const isActive = eqSettings.activePreset === preset;
          return (
            <Button
              key={preset}
              onPress={() => AudioBrowser.setEqualizerPreset(preset)}
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
  );
}
