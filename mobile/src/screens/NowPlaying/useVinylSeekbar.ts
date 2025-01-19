import { useMemo, useRef } from "react";
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useProgress } from "react-native-track-player";

import { useMusicStore } from "@/modules/media/services/Music";
import { useSeekStore } from "@/screens/NowPlaying/SeekService";

/** Controls the rotation of the vinyl on the "Now Playing" screen. */
export function useVinylSeekbar() {
  const { position } = useProgress(200);
  const rotationProgress = useSharedValue(0);
  const hasMounted = useRef(false);
  const activeTrack = useMusicStore((state) => state.activeTrack);
  const sliderPos = useSeekStore((state) => state.sliderPos);

  if (position === 0) {
    // Reset animation when position goes back to 0s.
    cancelAnimation(rotationProgress);
    rotationProgress.value = 0;
  } else if (position < (activeTrack?.duration ?? 0) - 1) {
    rotationProgress.value = withTiming(
      ((sliderPos ?? position) * 360) / 24,
      // Prevent vinyl rotation on mount.
      { duration: hasMounted.current ? 500 : 0, easing: Easing.linear },
    );
    if (!hasMounted.current) hasMounted.current = true;
  } else {
    // Cancel animation ~1s before the end due to weird behaviors if
    // the following image is large in size (ie: "animation spike").
    cancelAnimation(rotationProgress);
  }

  return useMemo(() => rotationProgress, [rotationProgress]);
}
