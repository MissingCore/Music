import { useAtomValue } from "jotai";

import { useMusicStore } from "@/modules/media/services/Music";
import { mediaModalAtom } from "./store";

import { PlaylistModal } from "./playlist";
import { PlaylistDeleteModal } from "./playlist-delete";
import { PlaylistNameModal } from "./playlist-name";
import { TrackModal } from "./track";
import { TrackToPlaylistModal } from "./track-to-playlist";
import { UpcomingTrackModal } from "./upcoming-track";

/** Wraps all modals used for media content. */
export function MediaModals() {
  const selectedModal = useAtomValue(mediaModalAtom);

  if (!selectedModal) return null;
  const { entity, scope, id, origin } = selectedModal;

  if (entity === "playlist") {
    if (scope === "new") {
      return <PlaylistNameModal scope="new" />;
    } else if (scope === "view") {
      return <PlaylistModal id={id} />;
    } else if (scope === "update") {
      return <PlaylistNameModal scope="update" id={id} />;
    } else {
      return <PlaylistDeleteModal id={id} />;
    }
  } else {
    if (scope === "view") {
      return <TrackModal id={id} origin={origin} />;
    } else if (scope === "current") {
      return <RenderTrackModal />;
    } else if (scope === "playlist") {
      return <TrackToPlaylistModal id={id} />;
    } else {
      return <UpcomingTrackModal />;
    }
  }
}

function RenderTrackModal() {
  const track = useMusicStore((state) => state.activeTrack);
  if (!track) return null;
  return <TrackModal id={track.id} origin="current" />;
}
