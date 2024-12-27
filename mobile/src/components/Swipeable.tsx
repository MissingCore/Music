import { cssInterop } from "nativewind";
import { Swipeable as AnimatedSwipeable } from "react-native-gesture-handler";

export type SwipeableRef = AnimatedSwipeable;

export const Swipeable = cssInterop(AnimatedSwipeable, {
  childrenContainerClassName: "childrenContainerStyle",
  containerClassName: "containerStyle",
});
