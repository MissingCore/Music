import type { LegendListRef } from "@legendapp/list";
import { LegendList } from "@legendapp/list";
import type { NavigationState } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { Stack, router, useRootNavigationState } from "expo-router";
import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { Search } from "~/icons/Search";
import { Settings } from "~/icons/Settings";
import { Router } from "~/services/NavigationStore";
import { useTabsByVisibility } from "~/services/UserPreferences";
import { useBottomActionsContext } from "~/hooks/useBottomActionsContext";
import { useHasNewUpdate } from "~/hooks/useHasNewUpdate";
import { useTheme } from "~/hooks/useTheme";

import { cn } from "~/lib/style";
import { ScrollPresets } from "~/components/Defaults/Legacy";
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
        kind="ripple"
        accessibilityLabel={t("feat.search.title")}
        onPress={() => router.navigate("/search")}
      >
        <Search />
      </IconButton>
      <IconButton
        kind="ripple"
        accessibilityLabel={t("term.settings")}
        onPress={() => router.navigate("/setting")}
        className="relative"
      >
        <Settings />
        {hasNewUpdate && (
          <View className="absolute right-3 top-3 size-2 rounded-full bg-red" />
        )}
      </IconButton>
    </Animated.View>
  );
}

/** List of routes in `(home)` group. */
function NavigationList() {
  const { t, i18n } = useTranslation();
  const { surface } = useTheme();
  const navState = useRootNavigationState() as NavigationState;
  const listRef = useRef<LegendListRef>(null);
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

  const legendListDependencies = useMemo(() => [t, routeName], [t, routeName]);

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
  }, [i18n.language, routeName, NavRoutes]);

  return (
    <View className="relative shrink grow">
      <LegendList
        ref={listRef}
        horizontal
        data={NavRoutes}
        keyExtractor={({ href }) => href as string}
        extraData={legendListDependencies}
        renderItem={({ item: { href, key, name } }) => (
          <Button
            onPress={() => Router.navigateMTT(href)}
            disabled={routeName === name}
            className="bg-transparent px-2 disabled:opacity-100"
          >
            <StyledText
              className={cn("text-sm", { "text-red": routeName === name })}
            >
              {t(key).toLocaleUpperCase()}
            </StyledText>
          </Button>
        )}
        contentContainerStyle={{ paddingHorizontal: 8 }}
        {...ScrollPresets}
      />
      {/* Scroll Shadow */}
      <LinearGradient
        pointerEvents="none"
        colors={[`${surface}E6`, `${surface}00`]}
        {...ShadowProps}
        className="absolute left-0 h-full w-4"
      />
      <LinearGradient
        pointerEvents="none"
        colors={[`${surface}00`, `${surface}E6`]}
        {...ShadowProps}
        className="absolute right-0 h-full w-4"
      />
    </View>
  );
}

const ShadowProps = { start: { x: 0.0, y: 1.0 }, end: { x: 1.0, y: 1.0 } };
//#endregion
