// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import AudioBrowser from "react-native-audio-browser";

import { SegmentedList } from "~/components/List/Segmented";
import { PlaybackParameterSlider } from "./PlaybackParameterSlider";

export function PlaybackParameterSettings() {
  return (
    <SegmentedList>
      <PlaybackParameterSlider
        field="pitch"
        onUpdate={AudioBrowser.setPitch}
        icon="voice-selection"
      />
      <PlaybackParameterSlider
        field="speed"
        onUpdate={AudioBrowser.setRate}
        icon="slow-motion-video"
      />
    </SegmentedList>
  );
}
