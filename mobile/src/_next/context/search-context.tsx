// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext, use, useRef } from "react";
import type { StoreApi } from "zustand";
import { createStore, useStore } from "zustand";

interface SearchStore {
  query: string;
  setQuery: (query: string) => void;
}

const SearchContext = createContext<StoreApi<SearchStore>>(null as never);

export function SearchProvider(props: { children: React.ReactNode }) {
  const storeRef = useRef<StoreApi<SearchStore>>(null);
  if (!storeRef.current) {
    storeRef.current = createStore<SearchStore>()((set) => ({
      query: "",
      setQuery: (query: string) => set({ query }),
    }));
  }
  return (
    <SearchContext value={storeRef.current}>{props.children}</SearchContext>
  );
}

export function useSearchStore<T>(selector: (state: SearchStore) => T) {
  const store = use(SearchContext);
  return useStore(store, selector);
}
