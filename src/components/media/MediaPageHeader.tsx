import { useAtomValue } from "jotai";
import { View, useWindowDimensions } from "react-native";
import { clamp } from "react-native-reanimated";

import { isPlayingAtom } from "@/features/playback/api/actions";
import { trackListAtom } from "@/features/playback/api/track";
import type { TrackListSource } from "@/features/playback/types";
import { areTrackReferencesEqual } from "@/features/playback/utils";

import { cn } from "@/lib/style";
import { AnimatedCover } from "@/components/media/AnimatedCover";
import { TextLine } from "@/components/ui/text";
import {
  PlayButton,
  RepeatButton,
  ShuffleButton,
} from "@/features/playback/components/MediaControls";
import type { ImageSource } from "./MediaImage";

/** @description Header component seen on the `(current)` pages. */
export function MediaPageHeader(props: {
  /** Displays an animated vinyl image above the title. */
  source?: ImageSource;
  title: string;
  /** Component placed underneath the title. */
  SubtitleComponent?: React.JSX.Element;
  /** Strings describing the media (ie: total playtime, number of tracks.) */
  metadata: string[];
  trackSource: TrackListSource;
}) {
  return (
    <View className="border-b border-b-surface50 px-1 pb-2">
      {/* Image type from our database is: `string | null`. */}
      {props.source !== undefined && (
        <HeroImage source={props.source} trackSource={props.trackSource} />
      )}
      <TextLine
        className={cn("font-geistMono text-lg text-foreground50", {
          "mt-1": props.source !== undefined,
        })}
      >
        {props.title}
      </TextLine>
      {props.SubtitleComponent}
      <View className="flex-row items-center gap-2">
        <TextLine className="flex-1 font-geistMonoLight text-xs text-foreground100">
          {props.metadata.join(" • ")}
        </TextLine>
        <View className="flex-row items-center">
          <RepeatButton />
          <ShuffleButton />
          <PlayButton trackSource={props.trackSource} className="ml-2" />
        </View>
      </View>
    </View>
  );
}

/**
 * @description Hook up `<AnimatedCover />` to logic that'll have it spin
 *  if we're currently playing this `TrackListSource`.
 */
function HeroImage(props: {
  source: ImageSource;
  trackSource: TrackListSource;
}) {
  const { width, height } = useWindowDimensions();
  const isPlaying = useAtomValue(isPlayingAtom);
  const { reference } = useAtomValue(trackListAtom);
  const isThisSource = areTrackReferencesEqual(reference, props.trackSource);

  const availableLength = clamp(100, width * 0.6, height * 0.4);

  return (
    <AnimatedCover
      type="album"
      source={props.source}
      availableLength={availableLength}
      className="mb-2"
      shouldSpin={isPlaying && isThisSource}
    />
  );
}
