import { useIsFocused } from "@react-navigation/native";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, Pressable, useWindowDimensions } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
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

import type { FileNode } from "~/db/schema";

import { useFolderContent } from "~/queries/folder";
import {
  StickyActionListLayout,
  useStickyActionListLayoutRef,
} from "~/layouts/StickyActionScroll";

import { cn } from "~/lib/style";
import { ContentPlaceholder } from "~/components/Transition/Placeholder";
import { StyledText } from "~/components/Typography/StyledText";
import { Track } from "~/modules/media/components/Track";
import { SearchResult } from "~/modules/search/components/SearchResult";

/** Animated scrollview supporting gestures. */
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

type FolderData = FileNode | Track.Content;

/** Screen for `/folder` route. */
export default function FolderScreen() {
  const isFocused = useIsFocused();
  const listRef = useStickyActionListLayoutRef<FolderData>();
  const [dirSegments, _setDirSegments] = useState<string[]>([]);

  const fullPath = dirSegments.join("/");

  const { isPending, data } = useFolderContent(fullPath);

  const renderedData = useMemo(
    () => [...(data?.subDirectories ?? []), ...(data?.tracks ?? [])],
    [data],
  );

  /** Modified state setter that scrolls to the top of the page. */
  const setDirSegments: React.Dispatch<React.SetStateAction<string[]>> =
    useCallback(
      (value) => {
        // Make sure we start at the beginning whenever the directory segments change.
        listRef.current?.scrollToOffset({ offset: 0 });
        _setDirSegments(value);
      },
      [listRef],
    );

  useEffect(() => {
    // Prevent event from working when this screen isn't focused.
    if (!isFocused) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      // Pop a directory segment if we detect a back gesture/action.
      () => {
        if (dirSegments.length === 0) return false;
        setDirSegments((prev) => prev.toSpliced(-1, 1));
        return true;
      },
    );
    return () => {
      subscription.remove();
    };
  }, [dirSegments, isFocused, setDirSegments]);

  // Information about this track list.
  const trackSource = { type: "folder", id: `${fullPath}/` } as const;

  return (
    <StickyActionListLayout
      listRef={listRef}
      titleKey="term.folders"
      estimatedItemSize={56} // 48px Height + 8px Margin Top
      data={renderedData}
      keyExtractor={(item) => (isTrackContent(item) ? item.id : item.path)}
      renderItem={({ item, index }) =>
        isTrackContent(item) ? (
          <Track
            {...item}
            trackSource={trackSource}
            className={index > 0 ? "mt-2" : undefined}
          />
        ) : (
          <SearchResult
            {...{ as: "ripple", type: "folder", title: item.name }}
            onPress={() => setDirSegments((prev) => [...prev, item.name])}
            className={cn("pr-4", { "mt-2": index > 0 })}
          />
        )
      }
      ListEmptyComponent={
        <ContentPlaceholder isPending={isPending} className="h-screen" />
      }
      scrollEnabled={!isPending}
      StickyAction={
        <Breadcrumbs
          dirSegments={dirSegments}
          setDirSegments={setDirSegments}
        />
      }
      estimatedActionSize={48}
    />
  );
}

function isTrackContent(data: unknown): data is Track.Content {
  return Object.hasOwn(data as Track.Content, "id");
}

//#region Breadcrumbs
function Breadcrumbs({
  dirSegments,
  setDirSegments,
}: {
  dirSegments: string[];
  setDirSegments: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const breadcrumbsRef = useAnimatedRef<Animated.ScrollView>();
  const { width: screenWidth } = useWindowDimensions();
  const lastWidth = useSharedValue(0);
  const removedWidth = useSharedValue(0);
  const newScrollPos = useSharedValue(0);

  const onLayoutShift = (newWidth: number) => {
    // `newWidth` doesn't include the `px-4` on `<StickyActionListLayout />`
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
    <AnimatedScrollView
      ref={breadcrumbsRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ width: screenWidth - 32 }}
      className="rounded-md bg-surface"
      contentContainerClassName="px-4"
    >
      <Animated.View
        onLayout={({ nativeEvent }) => onLayoutShift(nativeEvent.layout.width)}
        className="flex-row items-center gap-2"
      >
        {[undefined, ...dirSegments].map((dirName, idx) => (
          <Fragment key={idx}>
            {idx > 0 ? (
              <Animated.View entering={FadeInLeft} exiting={FadeOutRight}>
                <StyledText className="px-1 text-xs">/</StyledText>
              </Animated.View>
            ) : null}
            <Animated.View entering={FadeInLeft} exiting={FadeOutRight}>
              <Pressable
                // Pop the segments we pushed onto the stack and update
                // the path segments atom accordingly.
                onPress={() => setDirSegments((prev) => prev.toSpliced(idx))}
                // `pathSegments.length` instead of `pathSegments.length - 1`
                // due to us prepending an extra entry to denote the "Root".
                disabled={idx === dirSegments.length}
                className="min-h-12 justify-center active:opacity-75"
              >
                <StyledText
                  className={cn("text-xs", {
                    "text-red": idx === dirSegments.length,
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
    </AnimatedScrollView>
  );
}
//#endregion
