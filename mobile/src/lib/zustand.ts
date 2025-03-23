import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StateCreator } from "zustand";
import type { PersistOptions } from "zustand/middleware";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";
import { createStore } from "zustand/vanilla";

/** Creates a Zustand store that's persisted and supports subscriptions. */
export function createPersistedSubscribedStore<TStore extends object>(
  initialState: StateCreator<TStore>,
  options: Omit<PersistOptions<TStore>, "partialize" | "storage"> & {
    partialize?: (state: TStore) => Partial<TStore>;
  },
) {
  return createStore<TStore>()(
    subscribeWithSelector(
      persist(initialState, {
        storage: createJSONStorage(() => AsyncStorage),
        ...options,
      }),
    ),
  );
}
