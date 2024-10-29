import { Stack, router, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import Animated, {
  LinearTransition,
  SlideInDown,
} from "react-native-reanimated";

import { Search, Settings } from "@/icons";
import { useBottomActionsLayout } from "@/hooks/useBottomActionsLayout";
import { useHasNewUpdate } from "@/hooks/useHasNewUpdate";
import { useTheme } from "@/hooks/useTheme";

import { cn } from "@/lib/style";
import { Button, Ripple } from "@/components/new/Form";
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
      <NavigationBar
        stacked={isRendered.miniPlayer}
        hidden={!isRendered.navBar}
      />
    </Animated.View>
  );
}
//#endregion

//#region Navigation Bar
/** List of routes we'll display buttons for on the "home" page. */
const NavRoutes = [
  { href: "/", key: "header.home" },
  { href: "/folder", key: "common.folders" },
  { href: "/playlist", key: "common.playlists" },
  { href: "/track", key: "common.tracks" },
  { href: "/album", key: "common.albums" },
  { href: "/artist", key: "common.artists" },
] as const;

/** Custom navigation bar. */
function NavigationBar({ stacked = false, hidden = false }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { canvas } = useTheme();
  const { hasNewUpdate } = useHasNewUpdate();

  return (
    <Animated.View
      layout={LinearTransition}
      className={cn(
        "flex-row items-center overflow-hidden rounded-md bg-surface py-1",
        { "rounded-t-sm": stacked, "hidden opacity-0": hidden },
      )}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="grow px-2"
      >
        {NavRoutes.map(({ href, key }) => {
          const selected =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Button
              key={href}
              preset="plain"
              onPress={() => router.navigate(href)}
              disabled={selected}
              className="px-2 disabled:opacity-100"
            >
              <StyledText className={cn("text-sm", { "text-red": selected })}>
                {t(key).toLocaleUpperCase()}
              </StyledText>
            </Button>
          );
        })}
      </ScrollView>

      <Ripple
        preset="icon"
        accessibilityLabel={t("header.search")}
        android_ripple={{ color: `${canvas}40` }}
        onPress={() => router.navigate("/search")}
      >
        <Search />
      </Ripple>
      <Ripple
        preset="icon"
        accessibilityLabel={t("header.settings")}
        android_ripple={{ color: `${canvas}40` }}
        onPress={() => router.navigate("/setting")}
        className="relative"
      >
        <Settings />
        {hasNewUpdate && (
          <View className="absolute right-3 top-3 size-2 rounded-full bg-red" />
        )}
      </Ripple>
    </Animated.View>
  );
}
//#endregion
