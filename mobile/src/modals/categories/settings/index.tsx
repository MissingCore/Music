import { useAtomValue } from "jotai";

import { settingModalAtom } from "./store";

import { AddFilterModal } from "./add-filter";

/** Wraps all modals used for the settings page. */
export function SettingModals() {
  const selectedModal = useAtomValue(settingModalAtom);

  if (!selectedModal) return null;
  const { type, name, store } = selectedModal;

  if (type === "filter-list") {
    return <AddFilterModal {...{ name, store }} />;
  }

  throw new Error("Invalid modal type provided.");
}
