import { atom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { Easing, makeMutable, withTiming } from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";

import { playbackStore, usePlaybackStore } from "~/stores/Playback/store";
import { useSessionStore } from "~/services/SessionStore";

export const animatedPositionAtom = atom(makeMutable(0));
export const isSeekingAtom = atom(false);
export const renderedPositionAtom = atom(0);

const LISTENER_ID = 24680;

/** Lift shared logic for tracking the current playback progress in a shared value. */
export function SeekbarContext(props: { children: React.ReactNode }) {
  const activeTrack = usePlaybackStore((s) => s.activeTrack);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const lastPosition = usePlaybackStore((s) => s.lastPosition);
  const playbackSpeed = useSessionStore((s) => s.playbackSpeed);
  const animatedPosition = useAtomValue(animatedPositionAtom);
  const isSeeking = useAtomValue(isSeekingAtom);
  const setRenderedPos = useSetAtom(renderedPositionAtom);
  const pausedPositionRef = useRef(-1);

  /** Helper to smoothly animate `animatedPosition`. */
  const animateSlider = useCallback(
    (fromPos: number) => {
      if (!activeTrack) return;
      const remainingSeconds = activeTrack.duration - fromPos;
      const estimatedAnimationDuration =
        (remainingSeconds * 1000) / playbackSpeed;

      animatedPosition.value = withTiming(activeTrack.duration, {
        duration: estimatedAnimationDuration,
        easing: Easing.linear,
      });
    },
    [animatedPosition, playbackSpeed, activeTrack],
  );

  // Initialize `animatedPosition`.
  useEffect(() => {
    animatedPosition.value = lastPosition;
    setRenderedPos(lastPosition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animatedPosition, setRenderedPos]);

  // Synchronize with `lastPosition`.
  useEffect(() => {
    if (isSeeking) return;
    const priorPos = Number(String(animatedPosition.value));
    animatedPosition.value = lastPosition;
    // Prevent slight rubberbanding when pausing as `animatedPosition` will be
    // ahead of whatever is reported by the `PlaybackProgressUpdated` event.
    if (!isPlaying && priorPos !== 0) {
      //! Prevents an infinite loop caused by `animatedPosition.value` for some
      //! reason not equaling `priorPos` after setting it in this block.
      if (lastPosition === pausedPositionRef.current) {
        animatedPosition.value = pausedPositionRef.current;
        return;
      }
      pausedPositionRef.current = priorPos;
      setLastPosition(priorPos);
      return;
    }
    // Don't animate slider as it'll cause the app to freeze on return due
    // to pending timers?
    if (!isPlaying || AppState.currentState !== "active") return;
    animateSlider(lastPosition);
  }, [animateSlider, animatedPosition, isPlaying, isSeeking, lastPosition]);

  // Synchronize JS state with shared value.
  useEffect(() => {
    scheduleOnUI(() =>
      animatedPosition.addListener(LISTENER_ID, (value) =>
        scheduleOnRN(setRenderedPos, value),
      ),
    );
    return () => {
      scheduleOnUI(() => animatedPosition.removeListener(LISTENER_ID));
    };
  }, [animatedPosition, setRenderedPos]);

  return props.children;
}

//#region Helpers
/** Update `lastPosition` to be the value in the shared value. */
function setLastPosition(position: number) {
  playbackStore.setState({ lastPosition: position });
}
//#endregion
