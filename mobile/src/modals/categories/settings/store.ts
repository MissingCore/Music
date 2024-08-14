import { atom } from "jotai";

import type { allowListAtom } from "@/features/setting/api/library";

export type SettingModal = {
  type: "filter-list";
  name: string;
  store: typeof allowListAtom;
};

/** Describes the modal we want to display. */
export const settingModalAtom = atom<SettingModal | null>(null);
