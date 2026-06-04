import AudioBrowser from "react-native-audio-browser";

import { playbackStore } from "~/stores/Playback/store";

import { clamp } from "~/utils/number";

export function toggleStatus() {
  const nextState = !playbackStore.getState().isReplayGainEnabled;
  playbackStore.setState({ isReplayGainEnabled: nextState });
  AudioBrowser.setReplayGainStatus(nextState);
}

export function updatePreAmpWithTags(dB: number) {
  playbackStore.setState({ preAmpWTags: clamp(-15, dB, 15) });
}

export function updatePreAmpWithoutTags(dB: number) {
  playbackStore.setState({ preAmpWOTags: clamp(-15, dB, 15) });
}
