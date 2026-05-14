import { useNavigation, useNavigationState } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
  FadeIn,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";

import { Search } from "~/resources/icons/Search";
import { Settings } from "~/resources/icons/Settings";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useTabsByVisibility } from "~/stores/Preference/hooks";
import { useRenderBottomActions } from "../hooks/useBottomActions";
import { useHasNewUpdate } from "../hooks/useHasNewUpdate";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { capitalize } from "~/utils/string";
import { createAnimatedMaterialSymbol } from "~/components/Base/AnimatedMaterialSymbol";
import { FlatList, useFlatListRef } from "~/components/Base/List";
import { Pressable } from "~/components/Base/Pressable";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { Menu } from "~/components/Menu";
import { TStyledText } from "~/components/Typography/StyledText";
import { useTheme } from "~/modules/customization/theme/hooks";
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
        pointerEvents="box-none"
        className="absolute bottom-0 left-0 h-18 w-full flex-row items-center justify-end gap-2 p-4 pt-0"
      >
        {rendered.miniPlayer ? <MiniPlayer /> : null}
        {rendered.navBar ? <HomeActions /> : null}
      </Animated.View>
    </View>
  );
}
//#endregion

//#region Home Actions
const AnimatedMenuIcon = createAnimatedMaterialSymbol(
  // "Menu" SVG
  "M176.15-261.08q-11.63 0-19.85-8.22-8.22-8.23-8.22-19.77 0-11.55 8.22-19.76t19.85-8.21h607.89q11.44 0 19.66 8.23 8.22 8.22 8.22 19.77 0 11.54-8.22 19.75t-19.66 8.21H176.15Zm0-191.34q-11.63 0-19.85-8.23-8.22-8.22-8.22-19.77 0-11.54 8.22-19.75t19.85-8.21h607.89q11.44 0 19.66 8.22 8.22 8.23 8.22 19.77t-8.22 19.75q-8.22 8.22-19.66 8.22H176.15Zm0-191.35q-11.63 0-19.85-8.22-8.22-8.23-8.22-19.77 0-11.55 8.22-19.76t19.85-8.21h607.89q11.44 0 19.66 8.22 8.22 8.23 8.22 19.77 0 11.55-8.22 19.76t-19.66 8.21H176.15Z",
  // "Close" SVG
  "M480-440.27 278.38-238.65q-8.3 8.3-19.76 8.25-11.47-.06-19.97-8.56-8.19-8.5-8.03-19.62.15-11.11 8.34-19.3L440.27-480 238.96-682.12q-7.81-7.8-8-19.11-.19-11.31 8-19.81 8.19-8.5 19.46-8.75 11.27-.25 19.96 8.25L480-519.73l201.81-201.81q8.11-8.11 19.57-8.06 11.47.06 20.16 8.56 8 8.5 7.84 19.62-.15 11.11-8.34 19.3L519.73-480l201.31 202.12q7.81 7.8 8 19.11.19 11.31-8 19.81-8.19 8.5-19.46 8.75-11.27.25-19.77-8.44L480-440.27Z",
);

function HomeActions() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  const { hasNewUpdate } = useHasNewUpdate();
  const showNavbar = usePreferenceStore((s) => s.showNavbar);

  return (
    <Menu
      entering={OnRTL.decide(SlideInLeft, SlideInRight)}
      exiting={OnRTL.decide(SlideOutLeft, SlideOutRight)}
      visible={visible}
      anchor={
        <View className="relative">
          <FilledIconButton
            Icon={AnimatedMenuIcon}
            accessibilityLabel={t("term.more")}
            onPress={() => setVisible((prev) => !prev)}
            alternative={visible}
            size="lg"
            className="size-14"
          />
          {!visible && hasNewUpdate && (
            <Animated.View
              entering={FadeIn}
              className="absolute top-3 right-3 size-2 rounded-full bg-primary"
            />
          )}
        </View>
      }
      anchorPosition="top"
      menuClassName="flex-row items-center gap-2"
    >
      {showNavbar ? <Navbar /> : null}
      <FilledIconButton
        Icon={Search}
        accessibilityLabel={t("feat.search.title")}
        onPress={() => navigation.navigate("Search")}
        size="lg"
        className="size-14"
      />
      <View className="relative">
        <FilledIconButton
          Icon={Settings}
          accessibilityLabel={t("term.settings")}
          onPress={() => navigation.navigate("Settings")}
          size="lg"
          className="size-14"
        />
        {hasNewUpdate && (
          <View className="absolute top-3 right-3 size-2 rounded-full bg-primary" />
        )}
      </View>
    </Menu>
  );
}
//#endregion

//#region Navbar
function Navbar() {
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
    <View className="relative ml-8 shrink grow overflow-hidden rounded-full bg-surfaceContainerLowest">
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
    </View>
  );
}

const ShadowProps = { start: { x: 0.0, y: 1.0 }, end: { x: 1.0, y: 1.0 } };
//#endregion

//#region Utils
function getHomeScreenRoute(tabKey: Tab) {
  if (tabKey === "home") return { term: "term.home", screen: "Home" } as const;
  return { term: `term.${tabKey}s`, screen: `${capitalize(tabKey)}s` } as const;
}
//#endregion
