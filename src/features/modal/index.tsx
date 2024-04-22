import { useAtomValue } from "jotai";
import { modalConfigAtom } from "./store";

import { TrackModal } from "./modals/TrackModal";

/** @description Wraps all the Bottom Sheet modals used. */
export function AppModals() {
  const currModal = useAtomValue(modalConfigAtom);

  if (currModal?.type === "track") {
    return <TrackModal trackId={currModal.ref} origin={currModal.origin} />;
  }

  return null;
}
