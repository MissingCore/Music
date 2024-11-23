import { View } from "react-native";

import type { PlayListSource } from "@/modules/media/types";

import { cn } from "@/lib/style";
import { StyledText } from "@/components/new/Typography";
import { MediaImage, MediaListControls } from "@/modules/media/components";

/*
  FIXME: Temporary patch while we delete old components.
*/

/** Header component on the `(current)` screens. */
export function MediaListHeader(props: {
  title: string;
  /** Strings describing the media (ie: total playtime, number of tracks.) */
  metadata: string[];
  trackSource: PlayListSource;
  /** Optionally render the specified image. */
  source?: MediaImage.ImageSource;
  /** Component placed underneath the title. */
  SubtitleComponent?: React.JSX.Element;
}) {
  return (
    <View className="border-b border-b-onSurface px-1 pb-2">
      {/* Image type from our database is: `string | null`. */}
      {props.source !== undefined && (
        <MediaImage type="playlist" source={props.source} size={128} />
      )}
      <StyledText
        numberOfLines={1}
        className={cn("text-lg", { "mt-1": props.source !== undefined })}
      >
        {props.title}
      </StyledText>
      {props.SubtitleComponent}
      <View className="flex-row items-center gap-2">
        <StyledText preset="dimOnCanvas" numberOfLines={1} className="flex-1">
          {props.metadata.join(" • ")}
        </StyledText>
        <MediaListControls trackSource={props.trackSource} />
      </View>
    </View>
  );
}
