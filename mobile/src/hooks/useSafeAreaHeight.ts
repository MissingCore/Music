import { platformApiLevel } from "expo-device";
import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Returns height of screen excluding system decoration (status & navigation bar). */
export function useSafeAreaHeight() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  // In Android API 35+, the "height" now includes the system decoration
  // areas and display cutout (status & navigation bar heights).
  //  - https://github.com/facebook/react-native/issues/47080#issuecomment-2421914957
  return useMemo(() => {
    if (!platformApiLevel || platformApiLevel < 35) return screenHeight;
    return screenHeight - insets.top - insets.bottom;
  }, [insets.bottom, insets.top, screenHeight]);
}
