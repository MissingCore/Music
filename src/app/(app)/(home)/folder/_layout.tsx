import { Link, Stack } from "expo-router";
import { atom, useAtomValue } from "jotai";
import { ScopeProvider } from "jotai-scope";
import { Fragment, useEffect, useRef } from "react";
import { View } from "react-native";
import Animated, {
  FadeInLeft,
  FadeOutRight,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { cn } from "@/lib/style";
import { ScrollRow } from "@/components/ui/container";
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
  const prevPathSegments = useRef<string[]>([]);
  const breadcrumbsRef = useRef<ScrollRow.Ref>(null);
  const containerWidth = useSharedValue(0);
  const currWidth = useSharedValue(0);
  const lastWidth = useSharedValue(0);
  const removedWidth = useSharedValue(0);

  const onLayoutShift = (newWidth: number) => {
    currWidth.value = newWidth;
    if (newWidth < lastWidth.value) {
      removedWidth.value = lastWidth.value - newWidth;
    }
    lastWidth.value = newWidth;
  };

  const wrapperStyle = useAnimatedStyle(() => ({
    paddingRight: removedWidth.value,
  }));

  useEffect(() => {
    // Automatically scroll if we've going deeper in the tree.
    if (prevPathSegments.current.length <= pathSegments.length) {
      if (breadcrumbsRef.current) breadcrumbsRef.current.scrollToEnd();
    }
    prevPathSegments.current = pathSegments;
  }, [pathSegments]);

  return (
    <ScrollRow
      ref={breadcrumbsRef}
      onLayout={({ nativeEvent }) => {
        containerWidth.value = nativeEvent.layout.width;
      }}
      className="pb-2"
    >
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
                className="px-1 font-geistMono text-sm text-foreground50"
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
                  "font-geistMono text-sm text-foreground50 active:opacity-75",
                  { "text-accent50": idx === pathSegments.length - 1 },
                )}
              >
                {dirName}
              </Link>
            </Animated.View>
          </Fragment>
        ))}
      </Animated.View>
      <Animated.View
        onLayout={({ nativeEvent }) => {
          if (nativeEvent.layout.width !== 0) {
            breadcrumbsRef.current?.scrollTo({
              x: currWidth.value - removedWidth.value - containerWidth.value,
            });
            setTimeout(() => {
              removedWidth.value = 0;
            }, 300);
          }
        }}
        style={wrapperStyle}
      />
    </ScrollRow>
  );
}
