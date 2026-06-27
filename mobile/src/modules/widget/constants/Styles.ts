// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export const Styles = {
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
