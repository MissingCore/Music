import { usePlaybackContext } from "@/features/playback/context/PlaybackContext";

import { MediaImage } from "@/components/media/MediaImage";
import { ActionButton } from "@/components/ui/ActionButton";
import type { OptString } from "@/components/ui/Text";
import { TrackDuration } from "./TrackDuration";

/**
 * @description Displays information about the current track with 2
 *  different press scenarios (pressing the icon or the whole card will
 *  do different actions).
 */
export function TrackCard(props: {
  id: string;
  uri: string;
  textContent: [string, OptString];
  coverSrc: string | null;
  duration: number;
}) {
  const { playNewTrack } = usePlaybackContext();

  return (
    <ActionButton
      onPress={() => playNewTrack(props.id, props.uri)}
      textContent={props.textContent}
      image={
        <MediaImage
          type="track"
          imgSize={48}
          imgSrc={props.coverSrc}
          className="shrink-0 rounded-sm"
        />
      }
      asideContent={<TrackDuration duration={props.duration} />}
      iconOnPress={() => console.log("View Track Options")}
    />
  );
}
