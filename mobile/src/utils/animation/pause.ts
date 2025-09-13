import type {
  AnimatableValue,
  Animation,
  AnimationObject,
  SharedValue,
} from "react-native-reanimated";
import { defineAnimation } from "react-native-reanimated";

/*
  File based on `react-native-redash`'s `withPause` with some type fixes
  from looking at `react-native-reanimated`'s `withDelay` implementation.
    - https://github.com/wcandillon/react-native-redash/blob/bf4199c74c852a1d2cd104f0f71bec45685f6f23/src/Animations.ts
*/

type withPauseType = <T extends AnimatableValue>(
  animation: T,
  paused: SharedValue<boolean>,
) => T;

interface PausableAnimation extends Animation<PausableAnimation> {
  lastTimestamp: number;
  elapsed: number;
}

export const withPause = function <T extends AnimationObject>(
  _nextAnimation: T | (() => T),
  paused: SharedValue<boolean>,
): Animation<PausableAnimation> {
  "worklet";
  return defineAnimation<PausableAnimation, T>(
    _nextAnimation,
    (): PausableAnimation => {
      "worklet";
      const nextAnimation =
        typeof _nextAnimation === "function"
          ? _nextAnimation()
          : _nextAnimation;
      const onFrame = (state: PausableAnimation, now: number) => {
        const { lastTimestamp, elapsed } = state;
        if (paused.value) {
          state.elapsed = now - lastTimestamp;
          return false;
        }
        const dt = now - elapsed;
        const finished = nextAnimation.onFrame(nextAnimation, dt);
        state.current = nextAnimation.current;
        state.lastTimestamp = dt;
        return finished;
      };
      const onStart = (
        animation: Animation<any>,
        value: AnimatableValue,
        now: number,
        previousAnimation: Animation<any> | null,
      ) => {
        animation.lastTimestamp = now;
        animation.elapsed = 0;
        animation.current = 0;
        nextAnimation.onStart(nextAnimation, value, now, previousAnimation);
      };
      const callback = (finished?: boolean): void => {
        if (nextAnimation.callback) {
          nextAnimation.callback(finished);
        }
      };
      return {
        onFrame,
        onStart,
        isHigherOrder: true,
        current: nextAnimation.current,
        callback,
        previousAnimation: null,
        startTime: 0,
        started: false,
        lastTimestamp: 0,
        elapsed: 0,
      };
    },
  );
} as withPauseType;
