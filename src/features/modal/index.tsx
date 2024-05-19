import { useAtomValue } from "jotai";

import { trackDataAtom } from "@/features/playback/api/track";
import { modalAtom } from "./store";

import { PlaylistModal } from "./modals/PlaylistModal";
import { PlaylistDeleteModal } from "./modals/PlaylistDeleteModal";
import { PlaylistNameModal } from "./modals/PlaylistNameModal";
import { TrackModal } from "./modals/TrackModal";
import { TrackToPlaylistModal } from "./modals/TrackToPlaylistModal";
import { UpcomingTrackModal } from "./modals/UpcomingTrackModal";

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
