import { computeAmplitude } from "@missingcore/react-native-audio-analyzer";
import { useCallback, useMemo, useRef, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { Defs, G, LinearGradient, Rect, Stop, Svg } from "react-native-svg";

import { db } from "~/db";
import { waveformSamples } from "~/db/schema";

import { usePreferenceStore } from "~/stores/Preference/store";
import { sessionStore, useSessionStore } from "~/stores/Session/store";
import { findAndSetCachedWaveform } from "~/stores/Session/actions";

import { useTheme } from "~/modules/theme/useTheme";

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
  const [width, setWidth] = useState(0);

  const bars = useMemo(() => {
    //? We store enough data to have the waveform work in landscape. If in
    //? portrait mode, we need to downscale the number of bars.
    const maxBars = 1 + Math.floor((width - BAR_WIDTH) / (BAR_WIDTH + BAR_GAP));
    const downSampledBars: number[] = [];
    const scaleRatio = props.amplitudes.length / maxBars;
    for (let i = 0; i < maxBars; i++) {
      const idx = Math.floor(i * scaleRatio);
      downSampledBars.push(props.amplitudes[idx] ?? 0);
    }

    return downSampledBars.map((amplitude, index) => {
      const barHeight = Math.max(MIN_BAR_HEIGHT, props.height * amplitude);
      const x = (BAR_WIDTH + BAR_GAP) * index;
      const y = (props.height - barHeight) / 2;
      return (
        <Rect
          key={index}
          rx={1}
          x={x}
          y={y}
          height={barHeight}
          width={BAR_WIDTH}
        />
      );
    });
  }, [props.amplitudes, props.height, width]);

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: props.height, width: "100%" }}
    >
      <Svg style={{ height: "100%", width: "100%" }}>
        <Defs>
          <LinearGradient id="progress-grad" gradientUnits="userSpaceOnUse">
            <Stop
              offset={props.progress / props.maxProgress}
              stopColor={primary}
              stopOpacity={1}
            />
            <Stop
              offset={props.progress / props.maxProgress}
              stopColor={surfaceContainerHigh}
              stopOpacity={1}
            />
          </LinearGradient>
        </Defs>
        <G fill="url(#progress-grad)">{bars}</G>
      </Svg>
    </View>
  );
}
//#endregion

//#region useWaveformSamples
export function useWaveformSamples(id: string, uri: string) {
  const { height, width } = useWindowDimensions();
  const waveformSlider = usePreferenceStore((s) => s.waveformSlider);
  const activeWaveformContext = useSessionStore((s) => s.activeWaveformContext);
  const lastQueriedTrack = useRef("");

  const estimatedBarCount = Math.round(
    (Math.max(height, width) - 32) / (BAR_WIDTH + BAR_GAP),
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

  if (waveformSlider && lastQueriedTrack.current !== id) {
    lastQueriedTrack.current = id;
    getTrackWaveform();
  }

  return useMemo(
    () => activeWaveformContext?.samples || samplesFallback,
    [activeWaveformContext, samplesFallback],
  );
}
//#endregion
