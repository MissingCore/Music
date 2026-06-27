// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import AudioBrowser from "react-native-audio-browser";

import { equalizerStore } from "./store";
import type { EQPreset } from "./constants";

export function _initEQStore() {
  const customBands = equalizerStore.getState().customBands;
  const eqSettings = AudioBrowser.getEqualizerSettings();

  // Set `customBands` if EQ is supported and hasn't been initialized.
  if (eqSettings && customBands.length !== eqSettings.bandCount) {
    equalizerStore.setState({ customBands: eqSettings.bandLevels });
  }

  const defaultPresets = (eqSettings?.presets ?? []) as EQPreset[];
  if (defaultPresets.length > 0) defaultPresets.push("Custom");

  const minBandLevel = Math.min(
    (eqSettings?.lowerBandLevelLimit ?? 0) + 500,
    0,
  );
  const maxBandLevel = Math.max(
    (eqSettings?.upperBandLevelLimit ?? 0) - 500,
    0,
  );

  equalizerStore.setState({
    _hasHydrated: true,
    defaultFrequencies: eqSettings?.centerBandFrequencies ?? [],
    defaultPresets,
    minBandLevel,
    maxBandLevel,
    bandOrdinate: Math.max(Math.abs(minBandLevel), maxBandLevel),
  });
}

export function toggleEQ() {
  const { enabled, preset } = equalizerStore.getState();
  AudioBrowser.setEqualizerEnabled(!enabled);
  equalizerStore.setState({ enabled: !enabled });
  if (!enabled) setEQPreset(preset);
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
