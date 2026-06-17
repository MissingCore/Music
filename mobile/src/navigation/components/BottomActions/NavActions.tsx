import { useNavigation, useNavigationState } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
  SlideInDown,
  SlideInLeft,
  SlideInRight,
  SlideOutDown,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";

import { usePreferenceStore } from "~/stores/Preference/store";
import { useTabsByVisibility } from "~/stores/Preference/hooks";

import { useHasNewUpdate } from "~/navigation/hooks/useHasNewUpdate";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { capitalize } from "~/utils/string";
import { FlatList, useFlatListRef } from "~/components/Base/List";
import { Pressable } from "~/components/Base/Pressable";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { TStyledText } from "~/components/Typography/StyledText";
import { useTheme } from "~/modules/customization/theme/hooks";
import type { Tab } from "~/stores/Preference/types";

export function SearchButton() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <Animated.View
      entering={OnRTL.decide(SlideInRight, SlideInLeft)}
      exiting={OnRTL.decide(SlideOutRight, SlideOutLeft)}
    >
      <FilledIconButton
        icon="search"
        accessibilityLabel={t("feat.search.title")}
        onPress={() => navigation.navigate("Search")}
        size="lg"
        className="size-14"
      />
    </Animated.View>
  );
}

export function SettingsButton() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasNewUpdate } = useHasNewUpdate();
  return (
    <Animated.View
      entering={OnRTL.decide(SlideInLeft, SlideInRight)}
      exiting={OnRTL.decide(SlideOutLeft, SlideOutRight)}
      className="relative"
    >
      <FilledIconButton
        icon="settings"
        accessibilityLabel={t("term.settings")}
        onPress={() => navigation.navigate("Settings")}
        size="lg"
        className="size-14"
      />
      {hasNewUpdate && (
        <View className="absolute top-3 right-3 size-2 rounded-full bg-primary" />
      )}
    </Animated.View>
  );
}

//#region Navbar
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
      className="relative h-14 w-full shrink grow overflow-hidden rounded-full bg-surfaceContainerLowest"
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
//#endregion
