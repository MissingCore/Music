// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import {
  Directions,
  GestureDetector,
  useCompetingGestures,
  useFlingGesture,
} from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";

import { PlaybackControls } from "~/stores/Playback/actions";
import { usePreferenceStore } from "~/stores/Preference/store";

export function PlaybackControlGestureWrapper(props: {
  children: React.ReactNode;
}) {
  const enableSwipeGesture = usePreferenceStore((s) => s.nowPlayingGestures);

  const swipeLeftGesture = useFlingGesture({
    enabled: enableSwipeGesture,
    direction: Directions.LEFT,
    onActivate: () => scheduleOnRN(PlaybackControls.next),
  });
  const swipeRightGesture = useFlingGesture({
    enabled: enableSwipeGesture,
    direction: Directions.RIGHT,
    onActivate: () => scheduleOnRN(PlaybackControls.prev),
  });
  const gestures = useCompetingGestures(swipeLeftGesture, swipeRightGesture);

  return <GestureDetector gesture={gestures}>{props.children}</GestureDetector>;
}
