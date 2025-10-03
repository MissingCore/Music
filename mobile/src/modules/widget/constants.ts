export const WidgetDesign = {
  color: {
    /** Nothing widget color from color picker. */
    background: "#1A1B21",
    /** Can't pass `transparent` to `backgroundColor`. */
    transparent: "#00000000",
  },

  /** Estimated radius used by Nothing widgets from experimentation. */
  radius: 20,

  /** Estimated gap in layout grid for home screen. */
  layoutGap: 16,
} as const;

export const WidgetAction = {
  Open: "OPEN_APP",
  PlayPause: "PLAY_PAUSE",
  Prev: "PREV",
  Next: "NEXT",
} as const;
