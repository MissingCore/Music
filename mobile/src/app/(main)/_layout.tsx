import { Stack, router } from "expo-router";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";
import { FlatList, View } from "react-native";
import Animated, {
  LinearTransition,
  SlideInDown,
} from "react-native-reanimated";

import { Search, Settings } from "@/icons";
import { useBottomActionsLayout } from "@/hooks/useBottomActionsLayout";
import { useHasNewUpdate } from "@/hooks/useHasNewUpdate";
import { tabIndexAtom } from "@/layouts";

import { cn } from "@/lib/style";
import { Button, IconButton } from "@/components/new/Form";
import { StyledText } from "@/components/new/Typography";
import { MiniPlayer } from "@/modules/media/components";

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
  const { isRendered } = useBottomActionsLayout();

  return (
    <Animated.View
      entering={SlideInDown.duration(1000)}
      layout={LinearTransition}
      pointerEvents="box-none"
      className="absolute bottom-0 left-0 w-full gap-[3px] p-4 pt-0"
    >
      <MiniPlayer stacked={isRendered.navBar} />
      <TabBar stacked={isRendered.miniPlayer} hidden={!isRendered.navBar} />
    </Animated.View>
  );
}
//#endregion

//#region Tab Bar
/** Custom tab bar only visible while in routes in the `(home)` group. */
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
        accessibilityLabel={t("header.search")}
        onPress={() => router.navigate("/search")}
      >
        <Search />
      </IconButton>
      <IconButton
        kind="ripple"
        accessibilityLabel={t("header.settings")}
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

/** List of routes we'll display buttons for on the "home" page. */
const NavRoutes = [
  { href: "/", key: "header.home" },
  { href: "/folder", key: "common.folders" },
  { href: "/playlist", key: "common.playlists" },
  { href: "/track", key: "common.tracks" },
  { href: "/album", key: "common.albums" },
  { href: "/artist", key: "common.artists" },
] as const;

/** List of routes in `(home)` group. */
function NavigationList() {
  const { t } = useTranslation();

  const listRef = useRef<FlatList>(null);
  const tabIndex = useAtomValue(tabIndexAtom);

  useEffect(() => {
    if (!listRef.current) return;
    // Scroll to active tab (positioned in the middle of the visible area).
    listRef.current.scrollToIndex({ index: tabIndex, viewPosition: 0.5 });
  }, [tabIndex]);

  return (
    <FlatList
      ref={listRef}
      horizontal
      data={NavRoutes}
      keyExtractor={({ href }) => href}
      renderItem={({ item, index }) => (
        <Button
          onPress={() => router.navigate(item.href)}
          disabled={tabIndex === index}
          className="bg-transparent px-2 disabled:opacity-100"
        >
          <StyledText
            className={cn("text-sm", { "text-red": tabIndex === index })}
          >
            {t(item.key).toLocaleUpperCase()}
          </StyledText>
        </Button>
      )}
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="grow px-2"
    />
  );
}

//#endregion
