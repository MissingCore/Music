import AudioWaveView from "@kaannn/react-native-waveform";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useWindowDimensions } from "react-native";
import { computeAmplitude } from "react-native-audio-analyzer";

import { db } from "~/db";
import { waveformSamples } from "~/db/schema";

import { usePreferenceStore } from "~/stores/Preference/store";
import {
  findAndSetCachedWaveform,
  sessionStore,
  useSessionStore,
} from "~/services/SessionStore";
import { useTheme } from "~/hooks/useTheme";

//#region Waveform
interface WaveformProps {
  amplitudes: number[];
  height: number;

  progress: number;
  maxProgress: number;
}

const MIN_BAR_HEIGHT = 4;
const BAR_WIDTH = 2;
const BAR_GAP = 1.75;

export function Waveform(props: WaveformProps) {
  const { primary, surfaceContainerHigh } = useTheme();
  return (
    <AudioWaveView
      samples={props.amplitudes.map((s) => s * props.height)}
      progress={props.progress}
      maxProgress={props.maxProgress}
      waveMinHeight={MIN_BAR_HEIGHT * 2}
      waveWidth={BAR_WIDTH * 3}
      waveGap={4}
      waveCornerRadius={8}
      waveBackgroundColor={surfaceContainerHigh}
      waveProgressColor={primary}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
//#endregion

//#region useWaveformSamples
export function useWaveformSamples(id: string, uri: string) {
  const { height, width } = useWindowDimensions();
  const waveformSlider = usePreferenceStore((s) => s.waveformSlider);
  const activeWaveformContext = useSessionStore((s) => s.activeWaveformContext);
  const lastQueriedTrack = useRef("");

  const estimatedBarCount = useMemo(
    () => Math.round((Math.max(height, width) - 32) / (BAR_WIDTH + BAR_GAP)),
    [height, width],
  );

  // Results in a waveform at min height.
  const samplesFallback: number[] = useMemo(
    () => new Array(estimatedBarCount).fill(0),
    [estimatedBarCount],
  );

  const getTrackWaveform = useCallback(async () => {
    //* See if a cached waveform exist.
    const cachedWaveform = await findAndSetCachedWaveform(id);
    if (cachedWaveform) return;

    // Downsampling from a multiplier will take the same amount of time.
    const scaledBarCount = estimatedBarCount * 8;

    //* Compute waveform data otherwise.
    let parsedUrl = uri;
    if (parsedUrl.startsWith("file://")) parsedUrl = parsedUrl.slice(8);
    let sampleData: number[] = [];
    try {
      sampleData = computeAmplitude(parsedUrl, scaledBarCount);
    } catch {}

    if (sampleData.length > 0) {
      const downSampledBars: number[] = [];
      // Downsample the data.
      for (let i = 0; i < estimatedBarCount; i++) {
        const idx = Math.floor((i / estimatedBarCount) * scaledBarCount);
        downSampledBars.push(sampleData[idx] ?? 0);
      }

      // Normalize amplitude.
      const multiplier = Math.pow(Math.max(...downSampledBars), -1);
      sampleData = downSampledBars.map((n) => n * multiplier);
    } else {
      sampleData = samplesFallback;
    }

    //* Cache the data so we don't need to recompute this in the future.
    const entry = { trackId: id, samples: sampleData };
    await db.insert(waveformSamples).values(entry).onConflictDoNothing();
    sessionStore.setState({ activeWaveformContext: entry });
  }, [estimatedBarCount, id, samplesFallback, uri]);

  useEffect(() => {
    if (!waveformSlider || lastQueriedTrack.current === id) return;
    lastQueriedTrack.current = id;
    getTrackWaveform();
  }, [getTrackWaveform, id, waveformSlider]);

  return useMemo(
    () => activeWaveformContext?.samples || samplesFallback,
    [activeWaveformContext, samplesFallback],
  );
}
//#endregion
