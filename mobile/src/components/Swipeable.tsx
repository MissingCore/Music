import { cssInterop } from "nativewind";
import { useRef } from "react";
import { Swipeable as AnimatedSwipeable } from "react-native-gesture-handler";

export function useSwipeableRef() {
  return useRef<AnimatedSwipeable>(null);
}
export const Swipeable = cssInterop(AnimatedSwipeable, {
  childrenContainerClassName: "childrenContainerStyle",
  containerClassName: "containerStyle",
});
