import { Slot, router } from "expo-router";
import { atom, useAtomValue } from "jotai";
import { ScopeProvider } from "jotai-scope";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, useWindowDimensions } from "react-native";
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

import { StickyActionLayout } from "@/layouts/StickyActionLayout";

import { cn } from "@/lib/style";
import { StyledText } from "@/components/new/Typography";

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
  const { t } = useTranslation();
  return (
    <ScopeProvider atoms={[folderPathAtom]}>
      <StickyActionLayout
        title={t("common.folders")}
        StickyAction={<Breadcrumbs />}
        offsetConfig={{ bottom: false }}
      >
        <Slot />
      </StickyActionLayout>
    </ScopeProvider>
  );
}

/** Custom folder structure breadcrumbs. */
function Breadcrumbs() {
  const pathSegments = useAtomValue(folderPathAtom);
  const breadcrumbsRef = useAnimatedRef<Animated.ScrollView>();
  const { width: screenWidth } = useWindowDimensions();
  const lastWidth = useSharedValue(0);
  const removedWidth = useSharedValue(0);
  const newScrollPos = useSharedValue(0);

  const onLayoutShift = (newWidth: number) => {
    // `newWidth` doesn't include the `px-4` on `<StickyActionLayout />`
    // and in `<Animated.ScrollView />`.
    newScrollPos.value = 64 + newWidth - screenWidth;
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

  const offsetStyle = useAnimatedStyle(() => ({
    paddingRight: removedWidth.value,
  }));

  return (
    <Animated.ScrollView
      ref={breadcrumbsRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      className="rounded-md bg-surface"
      contentContainerClassName="min-h-12 grow px-4"
    >
      <Animated.View
        onLayout={({ nativeEvent }) => onLayoutShift(nativeEvent.layout.width)}
        className="flex-row items-center gap-2"
      >
        {[undefined, ...pathSegments].map((dirName, idx) => (
          <Fragment key={idx}>
            {idx !== 0 ? (
              <Animated.View entering={FadeInLeft} exiting={FadeOutRight}>
                <StyledText className="px-1 text-xs">/</StyledText>
              </Animated.View>
            ) : null}
            <Animated.View entering={FadeInLeft} exiting={FadeOutRight}>
              <Pressable
                // Pop the segments we pushed onto the stack and update
                // the path segments atom accordingly.
                onPress={() => router.dismiss(pathSegments.length - idx)}
                // `pathSegments.length` instead of `pathSegments.length - 1`
                // due to us prepending an extra entry to denote the "Root".
                disabled={idx === pathSegments.length}
                className="active:opacity-75"
              >
                <StyledText
                  className={cn("py-2 text-xs", {
                    "text-red": idx === pathSegments.length,
                  })}
                >
                  {dirName ?? "Root"}
                </StyledText>
              </Pressable>
            </Animated.View>
          </Fragment>
        ))}
      </Animated.View>
      {/* Animated padding to allow exiting scroll animation to look nice. */}
      <Animated.View style={offsetStyle} />
    </Animated.ScrollView>
  );
}
