import AudioBrowser from "react-native-audio-browser";

import { playbackStore } from "../store";

export function toggleStatus() {
  const nextState = !playbackStore.getState().isReplayGainEnabled;
  playbackStore.setState({ isReplayGainEnabled: nextState });
  AudioBrowser.setReplayGainStatus(nextState);
}
