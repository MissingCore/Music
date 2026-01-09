import type { ColorRole, HexColor } from "~/lib/style";

export type Icon = {
  /** Defaults to `24px`. */
  size?: number;
  /** Defaults to theme's `onSurface` color. */
  color?: ColorRole | HexColor;
  /**
   * Use the `filled` variant on the icon if available.
   * Defaults to `false`.
   */
  filled?: boolean;
};
