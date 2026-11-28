// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useSyncExternalStore } from "react";

type Listener = VoidFunction;

type Reducer<TData> = (prev: TData) => TData;

interface Atom<TData> {
  subscribe: (listener: Listener) => Listener;
  get: () => TData;
  set: (next: TData | Reducer<TData>) => void;
}

/** Creates an atom compatible with `useSyncExternalStore`. */
export function atom<TData>(initData: TData): Atom<TData> {
  let data = initData;
  const listeners = new Set<Listener>();

  function emitChange() {
    for (const listener of listeners) {
      listener();
    }
  }

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    /** Returns data in store. */
    get: () => data,
    /** Updates data in store and notifies all subscribers. */
    set: (next) => {
      const value = isReducer(next) ? next(data) : next;
      //? Skip re-render if value didn't change.
      if (Object.is(value, data)) return;
      data = value;
      emitChange();
    },
  } satisfies Atom<TData>;
}

/**
 * Subscribe to atom updates.
 *
 * **Limitation:** If `selector` is provided, it must not return an object
 * as `Object.is` is used to prevent unnecessary re-renders. Otherwise, you
 * may experience a re-render loop.
 * - https://react.dev/reference/react/useSyncExternalStore#im-getting-an-error-the-result-of-getsnapshot-should-be-cached
 */
export function useAtom<TData>(atom: Atom<TData>): TData;
export function useAtom<TData, TSel>(
  atom: Atom<TData>,
  selector: (data: TData) => TSel,
): TSel;
export function useAtom<TData, TSel>(
  atom: Atom<TData>,
  selector?: (data: TData) => TSel,
) {
  return useSyncExternalStore(atom.subscribe, () =>
    selector ? selector(atom.get()) : atom.get(),
  );
}

//#region Internal Helpers
function isReducer<TData>(val: TData | Reducer<TData>): val is Reducer<TData> {
  return typeof val === "function";
}
//#endregion
