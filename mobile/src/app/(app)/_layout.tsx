import { Link, Stack, router, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import Animated, {
  LinearTransition,
  SlideInDown,
} from "react-native-reanimated";

import { Search, Settings } from "@/resources/icons";
import { useMusicStore } from "@/modules/media/services/Music";
import { useHasNewUpdate } from "@/hooks/useHasNewUpdate";
import { useTheme } from "@/hooks/useTheme";

import { cn } from "@/lib/style";
import { Ripple } from "@/components/new/Form";
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
/** Actions stickied to the bottom of the screens in the `(app)` group. */
function BottomActions() {
  const pathname = usePathname(); // Fires whenever we navigate to a different screen.
  const activeTrackId = useMusicStore((state) => state.activeId);

  const isMiniPlayerRendered = !!activeTrackId;
  const hideNavBar = ["/playlist/", "/album/", "/artist/"].some((route) =>
    pathname.startsWith(route),
  );

  return (
    <Animated.View
      entering={SlideInDown.duration(1000)}
      layout={LinearTransition}
      pointerEvents="box-none"
      className="absolute bottom-0 left-0 w-full gap-[3px] p-4 pt-0"
    >
      <MiniPlayer stacked={!hideNavBar} />
      <NavigationBar stacked={isMiniPlayerRendered} hidden={hideNavBar} />
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

  if (hidden) return null;

  return (
    <Animated.View
      layout={LinearTransition}
      className={cn(
        "flex-row items-center overflow-hidden rounded-md bg-surface py-1",
        { "rounded-t-sm": stacked },
      )}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="grow px-2"
      >
        {NavRoutes.map(({ href, key }) => (
          <Link
            key={href}
            href={href}
            accessibilityRole="button"
            className={cn("px-2 py-4 font-roboto text-sm text-foreground", {
              "text-red":
                href === "/" ? pathname === "/" : pathname.startsWith(href),
            })}
          >
            {t(key).toLocaleUpperCase()}
          </Link>
        ))}
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
