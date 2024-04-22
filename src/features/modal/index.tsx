import { useAtomValue } from "jotai";

import { currentTrackDataAtom } from "@/features/playback/api/playing";
import { modalConfigAtom } from "./store";

import { TrackModal } from "./modals/TrackModal";

/** @description Wraps all the Bottom Sheet modals used. */
export function AppModals() {
  const currModal = useAtomValue(modalConfigAtom);
  const trackData = useAtomValue(currentTrackDataAtom);

  if (currModal?.type === "current") {
    if (!trackData) return null;
    return <TrackModal trackId={trackData.id} origin="current" />;
  } else if (currModal?.type === "track") {
    return <TrackModal trackId={currModal.ref} origin={currModal.origin} />;
  }

  return null;
}
