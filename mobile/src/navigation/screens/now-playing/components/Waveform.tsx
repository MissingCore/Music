import {
  Canvas,
  Group,
  LinearGradient,
  RoundedRect,
  vec,
} from "@shopify/react-native-skia";
import { useCallback, useEffect, useMemo, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { computeAmplitude } from "react-native-audio-analyzer";
import { useDerivedValue } from "react-native-reanimated";

import { db } from "~/db";
import { waveformSamples } from "~/db/schema";

import { usePreferenceStore } from "~/stores/Preference/store";
import {
  findAndSetCachedWaveform,
  sessionStore,
  useSessionStore,
} from "~/services/SessionStore";
import { useTheme } from "~/hooks/useTheme";

import { Colors } from "~/constants/Styles";

//#region Waveform
interface WaveformProps {
  amplitudes: number[];

  progress: number;
  maxProgress: number;
}

const MIN_BAR_HEIGHT = 4;
const BAR_WIDTH = 2;
const BAR_GAP = 1.75;

export function Waveform({ amplitudes, progress, maxProgress }: WaveformProps) {
  const { onSurface } = useTheme();

  const [canvasHeight, setCanvasHeight] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(0);

  const bars = useMemo(
    () =>
      amplitudes.map((amplitude, index) => {
        const barHeight = Math.max(MIN_BAR_HEIGHT, canvasHeight * amplitude);
        const x = (BAR_WIDTH + BAR_GAP) * index;
        const y = (canvasHeight - barHeight) / 2;
        return (
          <RoundedRect
            key={index}
            r={8}
            x={x}
            y={y}
            height={barHeight}
            width={BAR_WIDTH}
          />
        );
      }),
    [amplitudes, canvasHeight],
  );

  const gradientStart = useDerivedValue(() => vec(0, canvasHeight));
  const gradientEnd = useDerivedValue(() => vec(canvasWidth, canvasHeight));
  const gradientPositions = useDerivedValue(() => [
    progress / maxProgress,
    progress / maxProgress,
  ]);

  return (
    <View
      onLayout={(e) => {
        setCanvasHeight(e.nativeEvent.layout.height);
        setCanvasWidth(e.nativeEvent.layout.width);
      }}
      className="my-1"
    >
      <Canvas style={{ height: "100%", width: "100%" }}>
        <Group>
          {bars}
          <LinearGradient
            start={gradientStart}
            end={gradientEnd}
            positions={gradientPositions}
            colors={[Colors.red, onSurface]}
          />
        </Group>
      </Canvas>
    </View>
  );
}
//#endregion

//#region useWaveformSamples
export function useWaveformSamples(id: string, uri: string) {
  const { height, width } = useWindowDimensions();
  const waveformSlider = usePreferenceStore((s) => s.waveformSlider);
  const activeWaveformContext = useSessionStore((s) => s.activeWaveformContext);

  const estimatedBarCount = useMemo(
    () => Math.round((Math.max(height, width) - 32) / (BAR_WIDTH + BAR_GAP)),
    [height, width],
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
      // Otherwise, fill with 0s (meaning we'll get a waveform at min height).
      sampleData = new Array(estimatedBarCount).fill(0);
    }

    // Cache the data so we don't need to recompute this in the future.
    const [foundWaveform] = await db
      .insert(waveformSamples)
      .values({ trackId: id, samples: sampleData })
      .returning();

    sessionStore.setState({ activeWaveformContext: foundWaveform || null });
  }, [estimatedBarCount, id, uri]);

  useEffect(() => {
    if (!waveformSlider || activeWaveformContext?.trackId === id) return;
    getTrackWaveform();
  }, [activeWaveformContext?.trackId, getTrackWaveform, id, waveformSlider]);

  return activeWaveformContext?.samples || [];
}
//#endregion
