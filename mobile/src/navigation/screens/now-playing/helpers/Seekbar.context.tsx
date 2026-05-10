import { atom, useAtomValue, useSetAtom } from "jotai";
import { createContext, use, useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import {
  Easing,
  makeMutable,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useInForeground } from "~/stores/ListenerState";
import { playbackStore, usePlaybackStore } from "~/stores/Playback/store";
import { useSessionStore } from "~/stores/Session/store";

// export const animatedPositionAtom = atom(makeMutable(0));
export const isSeekingAtom = atom(false);
export const renderedPositionAtom = atom(0);

export const remainingSecondsAtom = atom(0);
export const fromPosAtom = atom(0);

const AnimatedPositionContext = createContext<SharedValue<number> | null>(null);

export function useAnimatedPosition() {
  const context = use(AnimatedPositionContext);
  if (!context)
    throw new Error(
      "useAnimatedPosition must be used within a SeekbarContext.",
    );
  return context;
}

/** Lift shared logic for tracking the current playback progress in a shared value. */
export function SeekbarContext(props: { children: React.ReactNode }) {
  const inForeground = useInForeground();
  const activeTrack = usePlaybackStore((s) => s.activeTrack);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const lastPosition = usePlaybackStore((s) => s.lastPosition);
  const playbackSpeed = useSessionStore((s) => s.playbackSpeed);
  const animatedPosition = useSharedValue(0);
  const isSeeking = useAtomValue(isSeekingAtom);
  const setRenderedPos = useSetAtom(renderedPositionAtom);
  const pausedPositionRef = useRef(-1);

  const setRemainingSeconds = useSetAtom(remainingSecondsAtom);
  const setFromPos = useSetAtom(fromPosAtom);

  /** Helper to smoothly animate `animatedPosition`. */
  const animateSlider = useCallback(
    (fromPos: number) => {
      if (!activeTrack) return;
      const remainingSeconds = activeTrack.duration - fromPos;
      setFromPos(fromPos);
      setRemainingSeconds(remainingSeconds);
      const estimatedAnimationDuration =
        (remainingSeconds * 1000) / playbackSpeed;

      animatedPosition.value = withTiming(activeTrack.duration, {
        duration: estimatedAnimationDuration,
        easing: Easing.linear,
      });
    },
    [
      animatedPosition,
      playbackSpeed,
      activeTrack,
      setRemainingSeconds,
      setFromPos,
    ],
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
    // const priorPos = Number(String(animatedPosition.value));
    animatedPosition.value = lastPosition;
    // // Prevent slight rubberbanding when pausing as `animatedPosition` will be
    // // ahead of whatever is reported by the `PlaybackProgressUpdated` event.
    // if (!isPlaying && priorPos !== 0 && lastPosition !== 0) {
    //   //! Prevents an infinite loop caused by `animatedPosition.value` for some
    //   //! reason not equaling `priorPos` after setting it in this block.
    //   if (lastPosition === pausedPositionRef.current) {
    //     animatedPosition.value = pausedPositionRef.current;
    //     return;
    //   }
    //   pausedPositionRef.current = priorPos;
    //   setLastPosition(priorPos);
    //   return;
    // }
    // Don't animate slider as it'll cause the app to freeze on return due
    // to pending timers?
    if (!isPlaying || AppState.currentState !== "active") return;
    animateSlider(lastPosition);
  }, [animateSlider, animatedPosition, isPlaying, isSeeking, lastPosition]);

  // Synchronize JS state with shared value.
  useAnimatedReaction(
    () => animatedPosition.value,
    (currVal) => {
      if (inForeground) scheduleOnRN(setRenderedPos, currVal);
    },
  );

  return (
    <AnimatedPositionContext.Provider value={animatedPosition}>
      {props.children}
    </AnimatedPositionContext.Provider>
  );
}

//#region Helpers
/** Update `lastPosition` to be the value in the shared value. */
function setLastPosition(position: number) {
  playbackStore.setState({ lastPosition: position });
}
//#endregion
