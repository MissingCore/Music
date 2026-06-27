// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import AsyncStorage from "expo-sqlite/kv-store";
import type { StateCreator } from "zustand";
import type { PersistOptions } from "zustand/middleware";
import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

/** Creates a Zustand store that's persisted. */
export function createPersistedStore<TStore extends object>(
  initialState: StateCreator<TStore>,
  options: Omit<PersistOptions<TStore>, "partialize" | "storage"> & {
    partialize?: (state: TStore) => Partial<TStore>;
  },
) {
  return createStore<TStore>()(
    persist(initialState, {
      storage: createJSONStorage(() => AsyncStorage),
      ...options,
    }),
  );
}
