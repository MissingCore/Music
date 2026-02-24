import type { SQLWrapper } from "drizzle-orm";

/** Operations passed to `where` clause. */
export type DrizzleFilter = Array<SQLWrapper | undefined>;
