import { useEffect, useState } from "react";
import { Keyboard } from "react-native";

export function useIsKeyboardVisible() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () =>
      setIsVisible(true),
    );
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () =>
      setIsVisible(false),
    );

    setIsVisible(Keyboard.isVisible());

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return isVisible;
}
