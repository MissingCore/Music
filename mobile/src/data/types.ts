import type { SQLWrapper } from "drizzle-orm";

import type { ScreenSortOptions } from "~/stores/ViewPreference/constants";
import type { MutableViewOrder } from "~/stores/ViewPreference/types";

/** Operations passed to `where` clause. */
export type DrizzleFilter = Array<SQLWrapper | undefined>;

/** Minimal amount of shared data to render a `Track` item. */
export type CommonTrack = {
  id: string;
  name: string;
  artwork: string | null;
  artists: string[] | null;
  albumName: string | null;
  uri: string;
  duration: number;
};

export type TracksSortOptions<TScreen extends MutableViewOrder> = {
  isAsc: boolean;
  order: ScreenSortOptions<TScreen>;
};
