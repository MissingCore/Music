import AudioBrowser from "react-native-audio-browser";

import { equalizerStore } from "./store";
import type { EQPreset } from "./constants";

export function toggleEQ() {
  const { enabled, preset } = equalizerStore.getState();
  AudioBrowser.setEqualizerEnabled(!enabled);
  equalizerStore.setState({ enabled: !enabled });
  setEQPreset(preset);
}

export function setEQPreset(preset: EQPreset) {
  equalizerStore.setState({ preset });
  if (preset !== "Custom") AudioBrowser.setEqualizerPreset(preset);
  else AudioBrowser.setEqualizerLevels(equalizerStore.getState().customBands);
}

export function setEQBandLevel(bandIndex: number, bandLevel: number) {
  const prevBandLevels = equalizerStore.getState().customBands;
  const newBandLevels = prevBandLevels.map((level, index) =>
    index !== bandIndex ? level : bandLevel,
  );

  equalizerStore.setState({ customBands: newBandLevels });
  AudioBrowser.setEqualizerLevels(newBandLevels);
}
