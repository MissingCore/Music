import type { MediaList } from "@/components/media/types";

/** Describes list of current playing track. */
export type TrackListSource = {
  type: MediaList | "folder";
  id: string;
  name: string;
};
