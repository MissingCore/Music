import { useNavigation, useNavigationState } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { Search } from "~/resources/icons/Search";
import { Settings } from "~/resources/icons/Settings";
import type { OrderableTab } from "~/services/UserPreferences";
import { useTabsByVisibility } from "~/services/UserPreferences";
import { useBottomActionsContext } from "~/hooks/useBottomActionsContext";
import { useHasNewUpdate } from "~/hooks/useHasNewUpdate";
import { useTheme } from "~/hooks/useTheme";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { capitalize } from "~/utils/string";
import { FlatList, useFlatListRef } from "~/components/Defaults";
import { Button, IconButton } from "~/components/Form/Button";
import { StyledText } from "~/components/Typography/StyledText";
import { MiniPlayer } from "~/modules/media/components/MiniPlayer";

//#region Bottom Actions
/** Actions stickied to the bottom of the screens in the `(main)` group. */
export function BottomActions() {
  const { isRendered } = useBottomActionsContext();
  return (
    <Animated.View
      layout={LinearTransition}
      pointerEvents="box-none"
      className="absolute bottom-0 left-0 w-full gap-[3px] p-4 pt-0"
    >
      <MiniPlayer stacked={isRendered.navBar} hidden={!isRendered.miniPlayer} />
      <TabBar stacked={isRendered.miniPlayer} hidden={!isRendered.navBar} />
    </Animated.View>
  );
}
//#endregion

//#region Tab Bar
/** Custom tab bar only visible while in routes in the `(main)` group. */
function TabBar({ stacked = false, hidden = false }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasNewUpdate } = useHasNewUpdate();

  return (
    <Animated.View
      layout={LinearTransition}
      className={cn(
        "flex-row items-center overflow-hidden rounded-md bg-surface py-1",
        { "rounded-t-sm": stacked, "hidden opacity-0": hidden },
      )}
    >
      <NavigationList />
      <IconButton
        Icon={Search}
        accessibilityLabel={t("feat.search.title")}
        onPress={() => navigation.navigate("Search")}
      />
      <View className="relative">
        <IconButton
          Icon={Settings}
          accessibilityLabel={t("term.settings")}
          onPress={() => navigation.navigate("Settings")}
        />
        {hasNewUpdate && (
          <View className="absolute right-3 top-3 size-2 rounded-full bg-red" />
        )}
      </View>
    </Animated.View>
  );
}

/** List of routes in `(home)` group. */
function NavigationList() {
  const { t, i18n } = useTranslation();
  const { surface } = useTheme();
  const navigation = useNavigation();
  const currNavRoutes = useNavigationState((s) => s.routes);
  const listRef = useFlatListRef();
  const { displayedTabs } = useTabsByVisibility();

  // Buttons for the routes we can navigate to on the "home" screen, whose
  // order can be customized.
  const NavRoutes: Array<{ key: ParseKeys; name: string }> = useMemo(
    () => [
      { key: "term.home", name: "Home" },
      ...displayedTabs.map((tabKey) => ({
        key: `term.${tabKey}s` satisfies ParseKeys,
        name: getHomeScreenName(tabKey),
      })),
    ],
    [displayedTabs],
  );

  // Name of the current route.
  const routeName = useMemo(() => {
    const homeRoute = currNavRoutes.find((r) => r.name === "HomeScreens");
    if (!homeRoute) return undefined;
    if (!homeRoute.state) return "Home";
    const { index, routeNames } = homeRoute.state;
    if (index === undefined || !routeNames) return undefined;
    return routeNames[index];
  }, [currNavRoutes]);

  useEffect(() => {
    if (!listRef.current || !routeName) return;
    try {
      const tabIndex = NavRoutes.findIndex(({ name }) => routeName === name);
      if (tabIndex === -1) return;
      // Scroll to active tab (positioned in the middle of the visible area).
      //  - Also fire when language changes to prevent a large gap at the end
      //  when we go from a language with longer words to one with shorter words.
      listRef.current.scrollToIndex({ index: tabIndex, viewPosition: 0.5 });
    } catch {}
  }, [listRef, i18n.language, routeName, NavRoutes]);

  return (
    <View className="relative shrink grow">
      <FlatList
        ref={listRef}
        horizontal
        data={NavRoutes}
        keyExtractor={({ key }) => key}
        renderItem={({ item: { key, name } }) => (
          <Button
            // @ts-expect-error - No type-safety of nested screens due to being dynamic.
            onPress={() => navigation.navigate("HomeScreens", { screen: name })}
            disabled={routeName === name}
            className="min-w-0 bg-transparent px-2 disabled:opacity-100"
          >
            <StyledText
              className={cn("text-sm", { "text-red": routeName === name })}
            >
              {t(key).toLocaleUpperCase()}
            </StyledText>
          </Button>
        )}
        // Suppresses error from `scrollToIndex` when we remount this layout
        // as a result of using the `push` navigation on the `/search` screen.
        onScrollToIndexFailed={() => {}}
        contentContainerClassName="px-2"
      />
      {/* Scroll Shadow */}
      <LinearGradient
        pointerEvents="none"
        colors={[`${surface}E6`, `${surface}00`]}
        {...ShadowProps}
        style={{ [OnRTL.decide("right", "left")]: 0 }}
        className="absolute h-full w-4"
      />
      <LinearGradient
        pointerEvents="none"
        colors={[`${surface}00`, `${surface}E6`]}
        {...ShadowProps}
        style={{ [OnRTL.decide("left", "right")]: 0 }}
        className="absolute h-full w-4"
      />
    </View>
  );
}

const ShadowProps = { start: { x: 0.0, y: 1.0 }, end: { x: 1.0, y: 1.0 } };
//#endregion

//#region Utils
export function getHomeScreenName(tabKey: OrderableTab | "home") {
  if (tabKey === "home") return "Home";
  return `${capitalize(tabKey)}s` as const;
}
//#endregion
