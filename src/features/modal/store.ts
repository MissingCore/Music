import { atom } from "jotai";

import type { MediaListType, MediaType } from "@/components/media/types";

export type PlaylistNameModalConfig = {
  type: "playlist-name";
  ref?: string;
  origin: "new" | "update";
};

export type ModalConfig =
  | {
      type: MediaType | "track-to-playlist";
      ref: string;
      origin?: MediaListType;
    }
  | { type: "current-track" | "upcoming-list" }
  | PlaylistNameModalConfig;

/** @description Describes the type of modal we want to display. */
export const modalConfigAtom = atom<ModalConfig | null>(null);
