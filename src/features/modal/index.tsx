import { useAtomValue } from "jotai";

import { currentTrackDataAtom } from "@/features/playback/api/playing";
import { modalAtom } from "./store";

import { PlaylistNameModal } from "./modals/PlaylistNameModal";
import { TrackModal } from "./modals/TrackModal";
import { TrackToPlaylistModal } from "./modals/TrackToPlaylistModal";
import { UpcomingTrackModal } from "./modals/UpcomingTrackModal";

/** @description Wraps all the Bottom Sheet modals used. */
export function AppModals() {
  const selectedModal = useAtomValue(modalAtom);
  const trackData = useAtomValue(currentTrackDataAtom);

  if (!selectedModal) return null;
  const { type, ref, origin } = selectedModal;

  switch (type) {
    case "playlist-name":
      return <PlaylistNameModal {...selectedModal} />;
    case "track":
      return <TrackModal trackId={ref} origin={origin} />;
    case "track-current":
      if (!trackData) return null;
      return <TrackModal trackId={trackData.id} origin="track-current" />;
    case "track-to-playlist":
      return <TrackToPlaylistModal trackId={ref} />;
    case "track-upcoming":
      return <UpcomingTrackModal />;
    default:
      throw new Error("Modal type not implemented yet.");
  }
}
