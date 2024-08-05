import { useAtomValue } from "jotai";

import { settingModalAtom } from "../../store";
import { AddListModal } from "./add-list-modal";

/** Wraps all modals used for the settings page. */
export function SettingModalsPortal() {
  const selectedModal = useAtomValue(settingModalAtom);

  if (!selectedModal) return null;
  const { type, name, store } = selectedModal;

  if (type === "filter-list") {
    return <AddListModal {...{ name, store }} />;
  }

  throw new Error("Invalid modal type provided.");
}
