import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { Stack, router, useRootNavigationState } from "expo-router";
import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { Search } from "~/icons/Search";
import { Settings } from "~/icons/Settings";
import { useTabsByVisibility } from "~/services/UserPreferences";
import { useBottomActionsContext } from "~/hooks/useBottomActionsContext";
import { useHasNewUpdate } from "~/hooks/useHasNewUpdate";
import { useTheme } from "~/hooks/useTheme";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { FlatList, useFlatListRef } from "~/components/Defaults";
import { Button, IconButton } from "~/components/Form/Button";
import { StyledText } from "~/components/Typography/StyledText";
import { MiniPlayer } from "~/modules/media/components/MiniPlayer";

//#region Layout
/** Contains content that doesn't take up the full-screen. */
export default function MainLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(home)" />
        <Stack.Screen name="(current)" />
      </Stack>
      <BottomActions />
    </>
  );
}
//#endregion

//#region Bottom Actions
/** Actions stickied to the bottom of the screens in the `(main)` group. */
function BottomActions() {
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
        onPress={() => router.navigate("/search")}
      />
      <View className="relative">
        <IconButton
          Icon={Settings}
          accessibilityLabel={t("term.settings")}
          onPress={() => router.navigate("/setting")}
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
  const navState = useRootNavigationState();
  const listRef = useFlatListRef();
  const { displayedTabs } = useTabsByVisibility();

  // Buttons for the routes we can navigate to on the "home" screen, whose
  // order can be customized.
  const NavRoutes: Array<{ href: Href; key: ParseKeys; name: string }> =
    useMemo(
      () => [
        { href: "/", key: "term.home", name: "index" },
        ...displayedTabs.map((tabKey) => ({
          href: `/${tabKey}` satisfies Href,
          key: `term.${tabKey}s` satisfies ParseKeys,
          name: tabKey,
        })),
      ],
      [displayedTabs],
    );

  // Name of the current route.
  const routeName = useMemo(() => {
    const mainRoute = navState.routes.find((r) => r.name === "(main)");
    if (!mainRoute || !mainRoute.state) return undefined;
    const homeRoute = mainRoute.state.routes.find((r) => r.name === "(home)");
    if (!homeRoute || !homeRoute.state) return undefined;
    const { index, routeNames } = homeRoute.state;
    if (index === undefined || !routeNames) return undefined;
    return routeNames[index];
  }, [navState]);

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
        keyExtractor={({ href }) => href as string}
        renderItem={({ item: { href, key, name } }) => (
          <Button
            onPress={() => router.navigate(href)}
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
