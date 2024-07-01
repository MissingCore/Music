import { useAtomValue } from "jotai";

import { trackDataAtom } from "@/features/playback/api/track";
import { modalAtom } from "./store";

import { PlaylistModal } from "./modals/playlist";
import { PlaylistDeleteModal } from "./modals/playlist-delete";
import { PlaylistNameModal } from "./modals/playlist-name";
import { TrackModal } from "./modals/track";
import { TrackToPlaylistModal } from "./modals/track-to-playlist";
import { UpcomingTrackModal } from "./modals/upcoming-track";

/** @description Wraps all the Bottom Sheet modals used. */
export function AppModals() {
  const selectedModal = useAtomValue(modalAtom);

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
  const trackData = useAtomValue(trackDataAtom);
  if (!trackData) return null;
  return <TrackModal id={trackData.id} origin="current" />;
}
