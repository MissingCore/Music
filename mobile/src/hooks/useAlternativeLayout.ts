// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useWindowDimensions } from "react-native";

/** Percentage of width that's reserved for a sidebar if shown. */
export const TABLET_SIDEBAR_WIDTH_RATIO = 0.4;

/** Determines if we should use an alternative layout due to having a large screen. */
export function useAlternativeLayout() {
  const { width } = useWindowDimensions();
  return width > 600;
}
