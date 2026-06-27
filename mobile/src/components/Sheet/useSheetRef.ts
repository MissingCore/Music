// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useRef } from "react";

export type TrueSheetRef = React.RefObject<TrueSheet | null>;

export function useSheetRef() {
  return useRef<TrueSheet>(null);
}
