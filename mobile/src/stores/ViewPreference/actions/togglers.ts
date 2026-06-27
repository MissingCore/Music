// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { viewPreferenceStore } from "../store";
import type { MutableViewOrder } from "../types";

export function toggleIsAsc(screen: MutableViewOrder) {
  const key = `${screen}IsAsc` as const;
  viewPreferenceStore.setState((prev) => ({ [key]: !prev[key] }));
}
