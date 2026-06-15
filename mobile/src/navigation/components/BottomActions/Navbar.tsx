import { useNavigation, useNavigationState } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";

import { usePreferenceStore } from "~/stores/Preference/store";
import { useTabsByVisibility } from "~/stores/Preference/hooks";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { capitalize } from "~/utils/string";
import { FlatList, useFlatListRef } from "~/components/Base/List";
import { Pressable } from "~/components/Base/Pressable";
import { TStyledText } from "~/components/Typography/StyledText";
import { useTheme } from "~/modules/customization/theme/hooks";
import type { Tab } from "~/stores/Preference/types";

export function Navbar() {
  const navigation = useNavigation();
  const { surfaceContainerLowest } = useTheme();
  const homeTab = usePreferenceStore((s) => s.homeTab);
  const { displayedTabs } = useTabsByVisibility();
  const listRef = useFlatListRef();
  const [mounted, setMounted] = useState(false);

  const [NavRoutes, initialTabIndex] = useMemo(
    () => [
      displayedTabs.map(getHomeScreenRoute),
      displayedTabs.findIndex((t) => t === homeTab),
    ],
    [displayedTabs, homeTab],
  );

  const homeScreensRoute = useNavigationState((s) =>
    s.routes.find((r) => r.name === "HomeScreens"),
  );
  const activeIndex = useMemo(() => {
    if (typeof homeScreensRoute?.state?.index !== "number")
      return initialTabIndex;
    return homeScreensRoute.state.index ?? initialTabIndex;
  }, [initialTabIndex, homeScreensRoute]);

  useEffect(() => {
    if (!listRef.current || !mounted || activeIndex < 0) return;
    listRef.current.scrollToIndex({ index: activeIndex, viewPosition: 0.5 });
  }, [listRef, activeIndex, mounted]);

  return (
    <Animated.View
      entering={SlideInDown}
      exiting={SlideOutDown}
      className="relative h-14 shrink grow overflow-hidden rounded-full bg-surfaceContainerLowest"
    >
      <FlatList
        ref={listRef}
        onLayout={() => setMounted(true)}
        horizontal
        data={NavRoutes}
        keyExtractor={({ term }) => term}
        renderItem={({ item: { term, screen }, index }) => {
          const isActive = index === activeIndex;
          return (
            <Pressable
              onPress={() => navigation.navigate("HomeScreens", { screen })}
              disabled={isActive}
              className="h-full min-w-12 items-center justify-center active:opacity-50"
            >
              <TStyledText
                textKey={term}
                className={cn("text-sm", { "text-primary": isActive })}
              />
            </Pressable>
          );
        }}
        // Suppresses error from `scrollToIndex` when we remount this layout
        // as a result of using the `push` navigation on the `/search` screen.
        onScrollToIndexFailed={() => {}}
        contentContainerClassName="gap-4 px-4"
      />
      {/* Scroll Shadow */}
      <LinearGradient
        pointerEvents="none"
        colors={[`${surfaceContainerLowest}E6`, `${surfaceContainerLowest}00`]}
        {...ShadowProps}
        style={{ [OnRTL.decide("right", "left")]: 0 }}
        className="absolute h-full w-4"
      />
      <LinearGradient
        pointerEvents="none"
        colors={[`${surfaceContainerLowest}00`, `${surfaceContainerLowest}E6`]}
        {...ShadowProps}
        style={{ [OnRTL.decide("left", "right")]: 0 }}
        className="absolute h-full w-4"
      />
    </Animated.View>
  );
}

const ShadowProps = { start: { x: 0.0, y: 1.0 }, end: { x: 1.0, y: 1.0 } };

function getHomeScreenRoute(tabKey: Tab) {
  if (tabKey === "home") return { term: "term.home", screen: "Home" } as const;
  return { term: `term.${tabKey}s`, screen: `${capitalize(tabKey)}s` } as const;
}
