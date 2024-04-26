import { useAtomValue } from "jotai";

import { currentTrackDataAtom } from "@/features/playback/api/playing";
import { modalConfigAtom } from "./store";

import { PlaylistNameModal } from "./modals/PlaylistNameModal";
import { TrackModal } from "./modals/TrackModal";
import { TrackToPlaylistModal } from "./modals/TrackToPlaylistModal";
import { UpcomingListModal } from "./modals/UpcomingListModal";

/** @description Wraps all the Bottom Sheet modals used. */
export function AppModals() {
  const currModal = useAtomValue(modalConfigAtom);
  const trackData = useAtomValue(currentTrackDataAtom);

  if (!currModal) return null;

  switch (currModal.type) {
    case "current-track":
      if (!trackData) return null;
      return <TrackModal trackId={trackData.id} origin="current-track" />;
    case "playlist-name":
      return <PlaylistNameModal {...currModal} />;
    case "track":
      return <TrackModal trackId={currModal.ref} origin={currModal.origin} />;
    case "track-to-playlist":
      return <TrackToPlaylistModal trackId={currModal.ref} />;
    case "upcoming-list":
      return <UpcomingListModal />;
    default:
      throw new Error("Modal type not implemented yet.");
  }
}
