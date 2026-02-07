import { atom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import type { AppStateStatus } from "react-native";
import { AppState, Keyboard } from "react-native";

export const appStateAtom = atom<AppStateStatus>("unknown");
export const keyboardVisibilityAtom = atom(false);

export function ListenerStateStoreProvider() {
  const setAppState = useSetAtom(appStateAtom);
  const setKeyboardVisibility = useSetAtom(keyboardVisibilityAtom);

  useEffect(() => {
    setAppState(AppState.currentState);
    setKeyboardVisibility(Keyboard.isVisible());

    const appStateChangeSubscription = AppState.addEventListener(
      "change",
      (state) => setAppState(state),
    );
    const keyboardDidShowSubscription = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisibility(true),
    );
    const keyboardDidHideSubscription = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisibility(false),
    );

    return () => {
      appStateChangeSubscription.remove();
      keyboardDidShowSubscription.remove();
      keyboardDidHideSubscription.remove();
    };
  }, [setAppState, setKeyboardVisibility]);

  return null;
}

export function useInForeground() {
  const appState = useAtomValue(appStateAtom);
  return appState === "active";
}

export function useIsKeyboardVisible() {
  const isVisible = useAtomValue(keyboardVisibilityAtom);
  return isVisible;
}
