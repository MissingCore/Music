import { useMemo } from "react";
import { useEqualizerSettings } from "react-native-audio-browser";

import { ListLayout } from "~/navigation/layouts/ListLayout";

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
    </ListLayout>
  );
}
