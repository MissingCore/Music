import { View, useWindowDimensions } from "react-native";
import { clamp } from "react-native-reanimated";

import { useMusicStore } from "@/modules/media/services/Music";
import { arePlaybackSourceEqual } from "@/modules/media/helpers/data";
import type { PlayListSource } from "@/modules/media/types";

import { cn } from "@/lib/style";
import { MediaListControls } from "@/modules/media/components/MediaListControls";
import { AnimatedVinyl } from "./animated-vinyl";
import type { MediaImage } from "./image";
import { TextLine } from "../ui/text";

/** Header component seen on the `(current)` pages. */
export function MediaScreenHeader(props: {
  /** Displays an animated vinyl image above the title. */
  source?: MediaImage.ImageSource;
  title: string;
  /** Component placed underneath the title. */
  SubtitleComponent?: React.JSX.Element;
  /** Strings describing the media (ie: total playtime, number of tracks.) */
  metadata: string[];
  trackSource: PlayListSource;
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
        <MediaListControls trackSource={props.trackSource} />
      </View>
    </View>
  );
}

/**
 * Hook up `<AnimatedVinyl />` to logic that'll have it spin if we're
 * currently playing this `PlayListSource`.
 */
function HeroImage(props: {
  source: MediaImage.ImageSource;
  trackSource: PlayListSource;
}) {
  const { width, height } = useWindowDimensions();
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const source = useMusicStore((state) => state.playingSource);
  const isThisSource = arePlaybackSourceEqual(source, props.trackSource);

  const availableLength = clamp(100, width * 0.6, height * 0.4);

  return (
    <AnimatedVinyl
      type="album"
      source={props.source}
      availableLength={availableLength}
      className="mb-2"
      shouldSpin={isPlaying && isThisSource}
    />
  );
}
