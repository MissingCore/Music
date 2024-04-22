import { atom } from "jotai";

import type { MediaType } from "@/components/media/types";

export type ModalConfig = {
  type: MediaType;
  ref: string;
  origin?: Exclude<MediaType, "track">;
};

/** @description Describes the type of modal we want to display. */
export const modalConfigAtom = atom<ModalConfig | null>(null);
