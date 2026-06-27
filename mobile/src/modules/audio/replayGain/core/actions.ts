// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import AudioBrowser from "react-native-audio-browser";

import { playbackStore } from "~/stores/Playback/store";
import { DB_OFFSET } from "./constants";

import { clamp } from "~/utils/number";

export function toggleStatus() {
  const nextState = !playbackStore.getState().isReplayGainEnabled;
  playbackStore.setState({ isReplayGainEnabled: nextState });
  AudioBrowser.setReplayGainStatus(nextState);
}

export function updatePreAmpWithTags(dB: number) {
  playbackStore.setState({
    preAmpWTags: clamp(DB_OFFSET.min, dB, DB_OFFSET.max),
  });
}

export function updatePreAmpWithoutTags(dB: number) {
  playbackStore.setState({
    preAmpWOTags: clamp(DB_OFFSET.min, dB, DB_OFFSET.max),
  });
}
