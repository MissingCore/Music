import {
  useIsPlaying as useRNTPIsPlaying,
  isPlaying,
} from "@weights-ai/react-native-track-player";
import { useMemo } from "react";

export function useIsPlaying() {
  const { playing } = useRNTPIsPlaying();
  return useMemo(() => playing ?? false, [playing]);
}

export async function getIsPlaying() {
  return (await isPlaying()).playing ?? false;
}
