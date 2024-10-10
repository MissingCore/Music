import { cssInterop } from "nativewind";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

const Swipeable = cssInterop(ReanimatedSwipeable, {
  childrenContainerClassName: "childrenContainerStyle",
  containerClassName: "containerStyle",
});

export { Swipeable };
