// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useState } from "react";
import AudioBrowser from "react-native-audio-browser";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { playbackStore, usePlaybackStore } from "~/stores/Playback/store";

import { SegmentedList } from "~/components/List/Segmented";
import { TStyledText } from "~/components/Typography/StyledText";
import { Switch } from "~/components/UI/Switch";
import { AudioEffectSlider } from "./AudioEffectSlider";

export function VolumeSettings() {
  const restoreVolume = usePlaybackStore((s) => s.restoreVolume);
  const volume = usePlaybackStore((s) => s.volume);
  const cachedValue = useSharedValue(volume);
  const [_volume, _setVolume] = useState(1);

  useAnimatedReaction(
    () => cachedValue.get(),
    (currVal) => scheduleOnRN(_setVolume, currVal),
  );

  return (
    <SegmentedList>
      <SegmentedList.Item
        labelTextKey="feat.playback.extra.restoreVolume"
        onPress={toggleRestoreVolume}
        RightElement={<Switch enabled={restoreVolume} />}
      />
      <SegmentedList.CustomItem className="gap-4 p-4">
        <TStyledText textKey="feat.playback.extra.volume" className="text-sm" />
        <AudioEffectSlider
          initValue={volume}
          liveValue={cachedValue}
          min={0}
          max={1}
          step={0.01}
          onChange={setVolume}
          _debounceMultiplier={5}
          icon="volume-up-filled"
          displayedValue={`${Math.round(_volume * 100)}%`}
        />
      </SegmentedList.CustomItem>
    </SegmentedList>
  );
}

//#region Helpers
function toggleRestoreVolume() {
  playbackStore.setState((prev) => ({ restoreVolume: !prev.restoreVolume }));
}

function setVolume(volume: number) {
  playbackStore.setState({ volume });
  AudioBrowser.setVolume(volume);
}
//#endregion
