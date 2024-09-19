import { useSetAtom } from "jotai";
import { Text } from "react-native";

import { playFromMediaList } from "@/modules/media/services/Playback";
import type { PlayListSource } from "@/modules/media/types";
import { mediaModalAtom } from "@/modals/categories/media/store";

import type { Prettify } from "@/utils/types";
import { ActionButton } from "@/components/form/action-button";
import { MediaImage } from "@/components/media/image";
import type { MediaList } from "@/modules/media/types";
import { getTrackDuration } from "../utils";

export namespace Track {
  export type Content = {
    id: string;
    imageSource: MediaImage.ImageSource;
    duration: number;
    textContent: ActionButton.Props["textContent"];
  };

  export type Props = Prettify<
    Content & {
      trackSource: PlayListSource;
      origin?: MediaList;
      hideImage?: boolean;
    }
  >;
}

/**
 * Displays information about the current track with 2 different press
 * scenarios (pressing the icon or the whole card will do different actions).
 */
export function Track({ id, trackSource, origin, ...props }: Track.Props) {
  const openModal = useSetAtom(mediaModalAtom);

  return (
    <ActionButton
      onPress={() => playFromMediaList({ trackId: id, source: trackSource })}
      textContent={props.textContent}
      Image={
        !props.hideImage ? (
          <MediaImage
            type="track"
            size={48}
            source={props.imageSource}
            className="shrink-0 rounded-sm"
          />
        ) : undefined
      }
      AsideContent={
        <Text className="shrink-0 font-geistMonoLight text-xs text-foreground100">
          {getTrackDuration(props.duration)}
        </Text>
      }
      icon={{
        label: "View track settings.",
        onPress: () =>
          openModal({ entity: "track", scope: "view", id, origin }),
      }}
    />
  );
}
