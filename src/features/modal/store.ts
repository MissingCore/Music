import { atom } from "jotai";

import type { Media, MediaList } from "@/components/media/types";

export type ModalPlaylistName = {
  type: "playlist-name";
  ref?: string;
  origin: "new" | "update";
};

export type Modal =
  | {
      type: Media | "track-to-playlist";
      ref: string;
      origin?: MediaList;
    }
  | { type: "track-current" | "track-upcoming"; ref?: never; origin?: never }
  | ModalPlaylistName;

/** @description Describes the modal we want to display. */
export const modalAtom = atom<Modal | null>(null);
