// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Returns spacing to account for Android navigation bar for edge-to-edge layouts. */
export function useLayoutBottomOffset(gutter = 16) {
  const { bottom } = useSafeAreaInsets();
  return useMemo(() => {
    const offset = bottom + gutter;
    return { offset, style: { paddingBottom: offset } };
  }, [bottom, gutter]);
}
