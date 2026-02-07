import { atom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { Keyboard } from "react-native";

export const keyboardVisibilityAtom = atom(false);

export function KeyboardVisibilityStoreProvider() {
  const setKeyboardVisibility = useSetAtom(keyboardVisibilityAtom);

  // Initialize `keyboardVisibilityAtom` & create subscription.
  useEffect(() => {
    setKeyboardVisibility(Keyboard.isVisible());

    const showSubscription = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisibility(true),
    );
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisibility(false),
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [setKeyboardVisibility]);

  return null;
}

export function useIsKeyboardVisible() {
  const isVisible = useAtomValue(keyboardVisibilityAtom);
  return isVisible;
}
