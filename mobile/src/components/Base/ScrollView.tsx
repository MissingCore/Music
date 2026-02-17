import { memo, useRef } from "react";
import type { KeyboardAwareScrollViewProps } from "react-native-keyboard-controller";
import { KeyboardAwareScrollView as RawKeyboardAwareScrollView } from "react-native-keyboard-controller";
import type {
  AnimatedRef,
  AnimatedScrollViewProps,
} from "react-native-reanimated";
import Animated, { useAnimatedRef } from "react-native-reanimated";

type ScrollViewSignature = (
  props: ScrollViewProps & { ref?: JoinedScrollViewRef },
) => React.JSX.Element;

type JoinedScrollViewRef = ScrollViewRef | AnimatedScrollViewRef;

export type ScrollViewRef = React.RefObject<Animated.ScrollView | null>;
export type AnimatedScrollViewRef = AnimatedRef<Animated.ScrollView>;
export type ScrollViewProps = AnimatedScrollViewProps & {
  ref?: JoinedScrollViewRef;
};

export const ScrollView = memo(function ScrollView(props) {
  return (
    <Animated.ScrollView
      removeClippedSubviews
      overScrollMode="never"
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      {...props}
    />
  );
}) as ScrollViewSignature;

export function useScrollViewRef() {
  return useRef<Animated.ScrollView>(null);
}

export function useAnimatedScrollViewRef() {
  return useAnimatedRef<Animated.ScrollView>();
}

//#region Keyboard Aware ScrollView
export const KeyboardAwareScrollView = memo(function KeyboardAwareScrollView(
  props: KeyboardAwareScrollViewProps,
) {
  return (
    <RawKeyboardAwareScrollView
      removeClippedSubviews
      overScrollMode="never"
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      bottomOffset={16}
      {...props}
    />
  );
});
//#endregion
