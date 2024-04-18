import { useSetAtom } from "jotai";

import { playAtom } from "@/features/playback/api/controls";
import type { TTrackSrc } from "@/features/playback/utils/trackList";

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
  trackSrc: TTrackSrc;
  textContent: [string, OptString];
  coverSrc: string | null;
  duration: number;
}) {
  const playFn = useSetAtom(playAtom);

  return (
    <ActionButton
      onPress={() => playFn({ trackId: props.id, trackSrc: props.trackSrc })}
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
