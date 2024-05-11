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
  const { type, id, origin } = selectedModal;

  switch (type) {
    case "playlist":
      return <PlaylistModal playlistName={id} />;
    case "playlist-delete":
      return <PlaylistDeleteModal playlistName={id} />;
    case "playlist-name":
      return <PlaylistNameModal {...selectedModal} />;
    case "track":
      return <TrackModal trackId={id} origin={origin} />;
    case "track-current":
      return <RenderTrackModal />;
    case "track-to-playlist":
      return <TrackToPlaylistModal trackId={id} />;
    case "track-upcoming":
      return <UpcomingTrackModal />;
    default:
      throw new Error("Modal type not implemented yet.");
  }
}

function RenderTrackModal() {
  const trackData = useAtomValue(trackDataAtom);
  if (!trackData) return null;
  return <TrackModal trackId={trackData.id} origin="track-current" />;
}
