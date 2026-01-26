import { atom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo } from "react";
import type { AppStateStatus } from "react-native";
import { AppState } from "react-native";

export const appStateAtom = atom<AppStateStatus>("unknown");

export function AppStateStoreProvider() {
  const setAppState = useSetAtom(appStateAtom);

  // Initialize `appStateAtom` & create subscription.
  useEffect(() => {
    setAppState(AppState.currentState);
    const subscription = AppState.addEventListener("change", (state) =>
      setAppState(state),
    );
    return () => subscription.remove();
  }, [setAppState]);

  return null;
}

export function useInForeground() {
  const appState = useAtomValue(appStateAtom);
  return useMemo(() => appState === "active", [appState]);
}
