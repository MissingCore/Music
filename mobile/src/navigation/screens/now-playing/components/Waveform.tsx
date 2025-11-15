import { useCallback, useEffect, useMemo } from "react";
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

export function useWaveformSamples(id: string, uri: string) {
  const { width, scale } = useWindowDimensions();
  const waveformSlider = usePreferenceStore((s) => s.waveformSlider);
  const activeWaveformContext = useSessionStore((s) => s.activeWaveformContext);

  const estimatedBarCount = useMemo(
    // FIXME: Calculations are currently based on the deviced width as
    // we don't support landscape mode. However, Android 16 will ignore
    // this for larger screen sizes.
    () => Math.round(((width - 32) / 10) * scale),
    [scale, width],
  );

  const getTrackWaveform = useCallback(async () => {
    //* See if a cached waveform exist.
    const cachedWaveform = await findAndSetCachedWaveform(id);
    if (cachedWaveform) return;

    //* Compute waveform data otherwise.
    let parsedUrl = uri;
    if (parsedUrl.startsWith("file://")) parsedUrl = parsedUrl.slice(8);
    let sampleData: number[] = [];
    try {
      sampleData = computeAmplitude(parsedUrl, estimatedBarCount);
    } catch {}

    // Normalize amplitude.
    if (sampleData.length > 0) {
      const multiplier = Math.pow(Math.max(...sampleData), -1);
      sampleData = sampleData.map((n) => n * multiplier);
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
