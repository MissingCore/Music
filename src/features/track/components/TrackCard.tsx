import { useSetAtom } from "jotai";

import { modalAtom } from "@/features/modal/store";
import { playAtom } from "@/features/playback/api/controls";
import type { TTrackSrc } from "@/features/playback/utils/trackList";

import type { Maybe } from "@/utils/types";
import type { MediaList } from "@/components/media/types";
import { MediaImage } from "@/components/media/MediaImage";
import { ActionButton } from "@/components/ui/ActionButton";
import { TrackDuration } from "./TrackDuration";

/**
 * @description Displays information about the current track with 2
 *  different press scenarios (pressing the icon or the whole card will
 *  do different actions).
 */
export function TrackCard(props: {
  id: string;
  trackSrc: TTrackSrc;
  textContent: [string, Maybe<string>];
  coverSrc: string | null;
  duration: number;
  origin?: MediaList;
}) {
  const playFn = useSetAtom(playAtom);
  const openModal = useSetAtom(modalAtom);

  return (
    <ActionButton
      onPress={() => playFn({ trackId: props.id, trackSrc: props.trackSrc })}
      textContent={props.textContent}
      image={
        <MediaImage
          type="track"
          size={48}
          source={props.coverSrc}
          className="shrink-0 rounded-sm"
        />
      }
      asideContent={<TrackDuration duration={props.duration} />}
      iconOnPress={() =>
        openModal({ type: "track", id: props.id, origin: props.origin })
      }
    />
  );
}
