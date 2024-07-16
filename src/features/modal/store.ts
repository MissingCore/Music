import { atom } from "jotai";

import type { Prettify } from "@/utils/types";
import type { MediaList } from "@/components/media/types";

type ModalEntity<TEntity extends string, TData extends Record<string, any>> = {
  entity: TEntity;
} & TData;

export type PlaylistModal = Prettify<
  ModalEntity<
    "playlist",
    | { scope: "new"; id?: never; origin?: never }
    | { scope: "view" | "update" | "delete"; id: string; origin?: never }
  >
>;

export type TrackModal = Prettify<
  ModalEntity<
    "track",
    | { scope: "view"; id: string; origin?: MediaList }
    | { scope: "playlist"; id: string; origin?: never }
    | { scope: "current" | "upcoming"; id?: never; origin?: never }
  >
>;

export type Modal = PlaylistModal | TrackModal;

/** Describes the modal we want to display. */
export const modalAtom = atom<Modal | null>(null);
