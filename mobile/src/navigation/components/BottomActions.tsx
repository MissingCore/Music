import { useNavigation, useNavigationState } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { Search } from "~/resources/icons/Search";
import { Settings } from "~/resources/icons/Settings";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useTabsByVisibility } from "~/stores/Preference/hooks";
import { useTheme } from "~/hooks/useTheme";
import { useRenderBottomActions } from "../hooks/useBottomActions";
import { useHasNewUpdate } from "../hooks/useHasNewUpdate";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { capitalize } from "~/utils/string";
import { FlatList, useFlatListRef } from "~/components/Defaults";
import { Button } from "~/components/Form/Button";
import { IconButton } from "~/components/Form/Button/Icon";
import { StyledText } from "~/components/Typography/StyledText";
import type { Tab } from "~/stores/Preference/types";
import { MiniPlayer } from "./MiniPlayer";

//#region Bottom Actions
/** Actions stickied to the bottom of the screens. */
export function BottomActions() {
  const rendered = useRenderBottomActions();
  //  Extra `View` is to fix positioning when button navigation is selected.
  return (
    <View>
      <Animated.View
        layout={LinearTransition}
        pointerEvents="box-none"
        className="absolute bottom-0 left-0 w-full gap-0.75 p-4 pt-0"
      >
        <MiniPlayer stacked={rendered.navBar} hidden={!rendered.miniPlayer} />
        <Navbar stacked={rendered.miniPlayer} hidden={!rendered.navBar} />
      </Animated.View>
    </View>
  );
}
//#endregion

//#region Navbar
/** Custom navbar while on the home screens. */
function Navbar({ stacked = false, hidden = false }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasNewUpdate } = useHasNewUpdate();

  return (
    <View
      className={cn(
        "flex-row items-center overflow-hidden rounded-md bg-surfaceContainerLowest py-1",
        { "rounded-t-xs": stacked, "hidden opacity-0": hidden },
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
          <View className="absolute top-3 right-3 size-2 rounded-full bg-red" />
        )}
      </View>
    </View>
  );
}

function NavigationList() {
  const { t, i18n } = useTranslation();
  const { surfaceContainerLowest } = useTheme();
  const navigation = useNavigation();
  const currNavRoutes = useNavigationState((s) => s.routes);
  const homeTab = usePreferenceStore((s) => s.homeTab);
  const { displayedTabs } = useTabsByVisibility();
  const listRef = useFlatListRef();
  const [mounted, setMounted] = useState(false);

  // Buttons for the routes we can navigate to on the "home" screen, whose
  // order can be customized.
  const NavRoutes: Array<{ key: ParseKeys; name: HomeScreenNames }> = useMemo(
    () =>
      displayedTabs.map(
        (tabKey) =>
          ({
            key: tabKey === "home" ? "term.home" : `term.${tabKey}s`,
            name: getHomeScreenName(tabKey),
          }) as const,
      ),
    [displayedTabs],
  );

  // Name of the current route.
  const routeName = useMemo(() => {
    const homeRoute = currNavRoutes.find((r) => r.name === "HomeScreens");
    if (!homeRoute) return undefined;
    if (!homeRoute.state) return getHomeScreenName(homeTab);
    const { index, routeNames } = homeRoute.state;
    if (index === undefined || !routeNames) return undefined;
    return routeNames[index];
  }, [currNavRoutes, homeTab]);

  useEffect(() => {
    if (!listRef.current || !routeName || !mounted) return;
    try {
      const tabIndex = NavRoutes.findIndex(({ name }) => routeName === name);
      if (tabIndex === -1) return;
      // Scroll to active tab (positioned in the middle of the visible area).
      //  - Also fire when language changes to prevent a large gap at the end
      //  when we go from a language with longer words to one with shorter words.
      listRef.current.scrollToIndex({ index: tabIndex, viewPosition: 0.5 });
    } catch {}
  }, [listRef, mounted, i18n.language, routeName, NavRoutes]);

  return (
    <View className="relative shrink grow">
      <FlatList
        ref={listRef}
        // `setMounted` to prevent firing `scrollToIndex` on an unmounted list.
        onLayout={() => setMounted(true)}
        horizontal
        data={NavRoutes}
        keyExtractor={({ key }) => key}
        renderItem={({ item: { key, name } }) => (
          <Button
            onPress={() => navigation.navigate("HomeScreens", { screen: name })}
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
        // Suppresses error from `scrollToIndex` when we remount this layout
        // as a result of using the `push` navigation on the `/search` screen.
        onScrollToIndexFailed={() => {}}
        contentContainerClassName="px-2"
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
    </View>
  );
}

const ShadowProps = { start: { x: 0.0, y: 1.0 }, end: { x: 1.0, y: 1.0 } };
//#endregion

//#region Utils
export type HomeScreenNames = "Home" | `${Capitalize<Exclude<Tab, "home">>}s`;

export function getHomeScreenName(tabKey: Tab) {
  if (tabKey === "home") return "Home";
  return `${capitalize(tabKey)}s` as const;
}
//#endregion
