import { useSetAtom } from "jotai";
import { useCallback } from "react";
import TrackPlayer, { Event } from "react-native-track-player";

import {
  nextAtom,
  playPauseToggleAtom,
  prevAtom,
  updateTrackPosAtom,
} from "../api/actions";

/**
 * @description Synchronize `react-native-track-player` with `expo-av` as
 *  we only want to use the media controls.
 */
export function usePlaybackServiceFn() {
  const nextFn = useSetAtom(nextAtom);
  const playPauseFn = useSetAtom(playPauseToggleAtom);
  const prevFn = useSetAtom(prevAtom);
  const seekFn = useSetAtom(updateTrackPosAtom);

  return useCallback(async () => {
    TrackPlayer.addEventListener(Event.RemotePlay, () => {
      TrackPlayer.play();
      playPauseFn();
    });
    TrackPlayer.addEventListener(Event.RemotePause, () => {
      TrackPlayer.pause();
      playPauseFn();
    });
    TrackPlayer.addEventListener(Event.RemoteNext, () => {
      nextFn();
    });
    TrackPlayer.addEventListener(Event.RemotePrevious, () => {
      prevFn();
    });
    TrackPlayer.addEventListener(Event.RemoteSeek, (e) => {
      seekFn(e.position);
    });
  }, [playPauseFn, nextFn, prevFn, seekFn]);
}
