import type { SQLWrapper } from "drizzle-orm";

/** Operations passed to `where` clause. */
export type DrizzleFilter = Array<SQLWrapper | undefined>;

/** Minimal amount of shared data to render a `Track` item. */
export type CommonTrack = {
  id: string;
  name: string;
  artwork: string | null;
  artists: string[] | null;
};
