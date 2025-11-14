import { useEffect, useMemo, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";
import { computeAmplitude } from "react-native-audio-analyzer";

import { db } from "~/db";
import type { TrackWithAlbum, WaveformSample } from "~/db/schema";
import { waveformSamples } from "~/db/schema";

import { usePreferenceStore } from "~/stores/Preference/store";

type Track = TrackWithAlbum & { waveformSample: WaveformSample | null };

export function useWaveformSamples(track: Track) {
  const trackRef = useRef<Track | null>(null);
  const [samples, setSamples] = useState<number[]>([]);
  const { width, scale } = useWindowDimensions();
  const waveformSlider = usePreferenceStore((s) => s.waveformSlider);

  const numSamples = useMemo(
    () => Math.round((width * scale - 32) / 10),
    [scale, width],
  );

  useEffect(() => {
    if (trackRef.current?.id === track.id || !waveformSlider) return;
    trackRef.current = track;
    if (track.waveformSample !== null) {
      setSamples(track.waveformSample.samples);
      return;
    }
    trackRef.current.waveformSample = { trackId: track.id, samples: [] };

    (async function () {
      //* Compute waveform data.
      let parsedUrl = track.uri;
      if (parsedUrl.startsWith("file://")) parsedUrl = parsedUrl.slice(8);
      let sampleData: number[] = [];
      try {
        // 100 samples should be enough for most screen sizes.
        sampleData = computeAmplitude(parsedUrl, 100);
      } catch {}

      // Normalize amplitude.
      if (sampleData.length > 0) {
        const multiplier = Math.pow(Math.max(...sampleData), -1);
        sampleData = sampleData.map((n) => n * multiplier);
      }

      // Cache the data so we don't need to recompute this in the future.
      await db
        .insert(waveformSamples)
        .values({ trackId: track.id, samples: sampleData });

      if (trackRef.current) {
        trackRef.current.waveformSample = {
          trackId: track.id,
          samples: sampleData,
        };
      }
      setSamples(sampleData);
    })();
  }, [numSamples, track, waveformSlider]);

  // Since we might be storing more samples than we can render.
  const downSampledSamples = useMemo(() => {
    if (!waveformSlider || samples.length === 0) return [];
    const extraSamples = 100 - numSamples;
    const extraSampleRatio = Math.ceil(extraSamples / numSamples) + 1;

    console.log(numSamples, extraSamples, extraSampleRatio);

    const newSamples: number[] = [];
    for (let i = 0; i < 100; i += extraSampleRatio) {}

    return newSamples;
  }, [numSamples, samples, waveformSlider]);

  return downSampledSamples;
}
