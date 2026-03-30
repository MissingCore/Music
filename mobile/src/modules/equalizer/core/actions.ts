import AudioBrowser from "react-native-audio-browser";

import { equalizerStore } from "./store";
import type { EQPreset } from "./constants";

export function toggleEQ() {
  const wasEnabled = equalizerStore.getState().enabled;
  AudioBrowser.setEqualizerEnabled(!wasEnabled);
  equalizerStore.setState({ enabled: !wasEnabled });
}

export function setEQPreset(preset: EQPreset) {
  equalizerStore.setState({ preset });
  if (preset !== "Custom") AudioBrowser.setEqualizerPreset(preset);
  else AudioBrowser.setEqualizerLevels(equalizerStore.getState().customBands);
}
