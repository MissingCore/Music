import { Link, Stack, usePathname } from "expo-router";
import { View } from "react-native";

import { cn } from "@/lib/style";
import { ScrollRow } from "@/components/ui/container";
import { ScrollShadow } from "@/components/ui/scroll-shadow";

export default function HomeLayout() {
  return (
    <>
      <NavigationBar />
      <Stack screenOptions={{ animation: "fade", headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="folder" />
        <Stack.Screen name="playlist" />
        <Stack.Screen name="track" />
        <Stack.Screen name="album" />
        <Stack.Screen name="artist" />
      </Stack>
    </>
  );
}

/** List of routes we'll display buttons for on the "home" page. */
const NavRoutes = [
  { href: "/", label: "ホーム" },
  { href: "/folder", label: "フォルダ" },
  { href: "/playlist", label: "プレイリスト" },
  { href: "/track", label: "曲" },
  { href: "/album", label: "アルバム" },
  { href: "/artist", label: "アーティスト" },
] as const;

/** Custom navigation bar for "home" screen. */
function NavigationBar() {
  const pathname = usePathname();
  return (
    <View className="mt-4">
      <ScrollRow contentContainerClassName="ml-2 gap-0 px-0 pr-[25%]">
        {NavRoutes.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            accessibilityRole="button"
            className={cn(
              "px-2 py-4 font-geistMonoLight text-lg text-foreground50",
              {
                "text-accent500":
                  href === "/" ? pathname === "/" : pathname.startsWith(href),
              },
            )}
          >
            {label}
          </Link>
        ))}
      </ScrollRow>
      <ScrollShadow size={16} />
    </View>
  );
}
