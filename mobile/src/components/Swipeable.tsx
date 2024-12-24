import { cssInterop } from "nativewind";
import { Swipeable as AnimatedSwipeable } from "react-native-gesture-handler";

const Swipeable = cssInterop(AnimatedSwipeable, {
  childrenContainerClassName: "childrenContainerStyle",
  containerClassName: "containerStyle",
});

export { Swipeable };
