import { Link, Stack } from "expo-router";
import { atom, useAtomValue } from "jotai";
import { ScopeProvider } from "jotai-scope";
import { Fragment } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, {
  FadeInLeft,
  FadeOutRight,
  scrollTo,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { cn } from "@/lib/style";
import { AnimatedScrollRow } from "@/components/ui/container";
import { ScrollShadow } from "@/components/ui/scroll-shadow";

/**
 * FIXME: Need to use atom to get the current layout path since although
 * `useLocalSearchParams()` re-renders in this `_layout.tsx` file when
 * navigating between `[...id]` routes, the value doesn't change.
 *
 * With this solution, we also encouter a problem with the value persisting
 * after the screen is popped off the stack (which makes sense). To reset
 * after being popped, we use `jotai-scope`.
 */
export const folderPathAtom = atom<string[]>([]);

export default function FolderLayout() {
  return (
    <ScopeProvider atoms={[folderPathAtom]}>
      <View>
        <Breadcrumbs />
        <ScrollShadow size={16} />
      </View>
      <Stack screenOptions={{ animation: "fade", headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="[...id]" />
      </Stack>
    </ScopeProvider>
  );
}

/** Custom folder structure breadcrumbs. */
function Breadcrumbs() {
  const pathSegments = useAtomValue(folderPathAtom);
  const breadcrumbsRef = useAnimatedRef<AnimatedScrollRow.Ref>();
  const { width: screenWidth } = useWindowDimensions();
  const lastWidth = useSharedValue(0);
  const removedWidth = useSharedValue(0);
  const newScrollPos = useSharedValue(0);

  const onLayoutShift = (newWidth: number) => {
    // `newWidth` doesn't include the `px-4` on `<AnimatedScrollView />`;
    // don't know exactly where the extra `8px` needed came from.
    newScrollPos.value = 40 + newWidth - screenWidth;
    if (newWidth < lastWidth.value) {
      removedWidth.value = withSequence(
        withTiming(lastWidth.value - newWidth, { duration: 0 }),
        withDelay(300, withTiming(0, { duration: 0 })),
      );
    }
    lastWidth.value = newWidth;
  };

  useDerivedValue(() => {
    scrollTo(breadcrumbsRef, newScrollPos.value, 0, true);
  });

  const wrapperStyle = useAnimatedStyle(() => ({
    paddingRight: removedWidth.value,
  }));

  return (
    <AnimatedScrollRow ref={breadcrumbsRef}>
      <Animated.View
        onLayout={({ nativeEvent }) => onLayoutShift(nativeEvent.layout.width)}
        className="flex-row gap-2"
      >
        {pathSegments.map((dirName, idx) => (
          <Fragment key={idx}>
            {idx !== 0 && (
              <Animated.Text
                entering={FadeInLeft}
                exiting={FadeOutRight}
                className="px-1 pb-2 font-geistMono text-sm text-foreground50"
              >
                /
              </Animated.Text>
            )}
            <Animated.View entering={FadeInLeft} exiting={FadeOutRight}>
              <Link
                href={`/folder/${pathSegments
                  .slice(0, idx + 1)
                  .map((segment) => encodeURIComponent(segment))
                  .join("/")}`}
                disabled={idx === pathSegments.length - 1}
                className={cn(
                  "pb-2 font-geistMono text-sm text-foreground50 active:opacity-75",
                  { "text-accent50": idx === pathSegments.length - 1 },
                )}
              >
                {dirName}
              </Link>
            </Animated.View>
          </Fragment>
        ))}
      </Animated.View>
      {/* Animated padding to allow exiting scroll animation to look nice. */}
      <Animated.View style={wrapperStyle} />
    </AnimatedScrollRow>
  );
}
