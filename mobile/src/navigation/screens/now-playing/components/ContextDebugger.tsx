import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { usePlaybackStore } from "~/stores/Playback/store";
import { useSessionStore } from "~/stores/Session/store";

import {
  fromPosAtom,
  isSeekingAtom,
  remainingSecondsAtom,
  renderedPositionAtom,
} from "../helpers/Seekbar.context";

import { StyledText } from "~/components/Typography/StyledText";

export function ContextDebugger() {
  const activeTrack = usePlaybackStore((s) => s.activeTrack);
  const lastPosition = usePlaybackStore((s) => s.lastPosition);
  const playbackSpeed = useSessionStore((s) => s.playbackSpeed);
  const isSeeking = useAtomValue(isSeekingAtom);
  const renderedPos = useAtomValue(renderedPositionAtom);
  const [lastPositionOnMount, setLastPositionOnMount] = useState(0);
  const remainingSeconds = useAtomValue(remainingSecondsAtom);
  const fromPos = useAtomValue(fromPosAtom);

  useEffect(() => {
    setLastPositionOnMount(lastPosition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View className="flex-1 justify-center p-8">
      <StyledText className="mb-4">useSharedValue</StyledText>
      <StyledText>{`isSeeking: ${isSeeking}`}</StyledText>
      <StyledText>{`trackDuration: ${activeTrack?.duration}`}</StyledText>
      <StyledText>{`lastPositionOnMount: ${lastPositionOnMount}`}</StyledText>
      <StyledText>{`lastPosition: ${lastPosition}`}</StyledText>
      <StyledText>{`renderedPos: ${renderedPos}`}</StyledText>
      <StyledText>{`playbackSpeed: ${playbackSpeed}`}</StyledText>
      <StyledText>{`fromPos: ${fromPos}`}</StyledText>
      <StyledText>{`remainingSeconds: ${remainingSeconds}`}</StyledText>
    </View>
  );
}
