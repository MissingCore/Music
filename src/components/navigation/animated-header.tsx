import { Stack } from "expo-router";
import { useCallback, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ScrollView, View, useWindowDimensions } from "react-native";
import Animated, {
  clamp,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/Styles";
import { BackButton } from "./back";
import { Heading } from "../ui/text";

type AnimatedHeaderProps = { title: string; children: React.ReactNode };

/** @description Have a title animate into the header bar on scroll. */
export function AnimatedHeader({ title, children }: AnimatedHeaderProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const initialContentHeight = useSharedValue(0);
  const titleHeight = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const [altHeaderBg, setAltHeaderBg] = useState(false);

  const checkTitlePosition = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = nativeEvent.contentOffset.y;
      // Denominator is how fast we want the header title to fade in.
      const hiddenPercent = (offsetY - titleHeight.value + 8) / 12;
      titleOpacity.value = clamp(0, hiddenPercent, 1);
      setAltHeaderBg(offsetY > 14); // ~14px is where the title touches the header.
    },
    [titleHeight, titleOpacity],
  );

  const reactivelySnap = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = nativeEvent.contentOffset.y;
      if (offsetY < 24) scrollRef.current?.scrollTo({ y: 0 });
      else if (offsetY >= 24 && offsetY < titleHeight.value + 16)
        scrollRef.current?.scrollTo({ y: titleHeight.value + 16 });
    },
    [titleHeight],
  );

  const animatedStyles = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const contentBuffer = useDerivedValue(() => {
    const visibleHeight =
      screenHeight - insets.top - 56 - titleHeight.value - 32;
    // Ensure content has a minimum margin bottom of `32px`.
    if (visibleHeight > initialContentHeight.value) return 32;
    // Get visible height when fully snapped.
    const snappedHeight = screenHeight - insets.top - 56 - 20;
    return initialContentHeight.value >= snappedHeight
      ? 32
      : snappedHeight - initialContentHeight.value + 32;
  });

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <Animated.View
              style={{
                paddingTop: insets.top,
                backgroundColor: altHeaderBg
                  ? Colors.surface800
                  : Colors.canvas,
              }}
            >
              <View className="flex h-14 flex-row items-center gap-4 p-1 pr-4">
                <BackButton />
                <Animated.Text
                  numberOfLines={1}
                  style={animatedStyles}
                  className="shrink font-ndot57 text-lg leading-none text-foreground50"
                >
                  {title}
                </Animated.Text>
              </View>
            </Animated.View>
          ),
        }}
      />
      <ScrollView
        ref={scrollRef}
        onScroll={checkTitlePosition}
        onMomentumScrollEnd={reactivelySnap}
        contentContainerClassName="grow px-4"
      >
        <Heading
          as="h1"
          onLayout={({ nativeEvent }) => {
            titleHeight.value = nativeEvent.layout.height;
          }}
          className="mb-8 text-start"
        >
          {title}
        </Heading>
        <Animated.View
          onLayout={({ nativeEvent }) => {
            initialContentHeight.value = nativeEvent.layout.height;
          }}
          style={{ marginBottom: contentBuffer }}
          className="flex-1"
        >
          {children}
        </Animated.View>
      </ScrollView>
    </>
  );
}
