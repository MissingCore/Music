import { getDefaultStore } from "jotai";
import TrackPlayer, { Event } from "react-native-track-player";

import {
  nextAtom,
  playPauseToggleAtom,
  prevAtom,
  updateTrackPosAtom,
} from "@/features/playback/api/actions";

export default async function PlaybackService() {
  const jotaiStore = getDefaultStore();

  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
    jotaiStore.set(playPauseToggleAtom);
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
    jotaiStore.set(playPauseToggleAtom);
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    jotaiStore.set(nextAtom);
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    jotaiStore.set(prevAtom);
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (e) => {
    jotaiStore.set(updateTrackPosAtom, e.position);
  });
}
