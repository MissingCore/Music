import { atom } from "jotai";

import type { MediaListType, MediaType } from "@/components/media/types";

export type ModalConfig =
  | { type: MediaType; ref: string; origin?: MediaListType }
  | { type: "current-track" | "upcoming-list" };

/** @description Describes the type of modal we want to display. */
export const modalConfigAtom = atom<ModalConfig | null>(null);
