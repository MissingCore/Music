import type { AppColor } from "~/lib/style";

export type Icon = {
  /** Defaults to `24px`. */
  size?: number;
  /** Defaults to theme's `onSurface` color. */
  color?: AppColor;
  /**
   * Use the alternative version of the icon if available (ie: filled, animated).
   * Defaults to `false`.
   */
  alternative?: boolean;
};
