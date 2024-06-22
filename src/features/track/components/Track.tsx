import { useSetAtom } from "jotai";

import { modalAtom } from "@/features/modal/store";
import { playAtom } from "@/features/playback/api/actions";
import type { TrackListSource } from "@/features/playback/types";

import type { ActionButtonProps } from "@/components/form/ActionButton";
import { ActionButton } from "@/components/form/ActionButton";
import type { ImageSource } from "@/components/media/MediaImage";
import type { MediaList } from "@/components/media/types";
import { MediaImage } from "@/components/media/MediaImage";
import { Duration } from "./Duration";

export type TrackContent = {
  id: string;
  imageSource: ImageSource;
  duration: number;
  textContent: ActionButtonProps["textContent"];
};

export type TrackProps = TrackContent & {
  trackSource: TrackListSource;
  origin?: MediaList;
  hideImage?: boolean;
};

/**
 * @description Displays information about the current track with 2
 *  different press scenarios (pressing the icon or the whole card will
 *  do different actions).
 */
export function Track({ id, trackSource, origin, ...props }: TrackProps) {
  const playFn = useSetAtom(playAtom);
  const openModal = useSetAtom(modalAtom);

  return (
    <ActionButton
      onPress={() => playFn({ id, source: trackSource })}
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
      AsideContent={<Duration duration={props.duration} />}
      iconLabel="View track settings."
      iconOnPress={() =>
        openModal({ entity: "track", scope: "view", id, origin })
      }
    />
  );
}
