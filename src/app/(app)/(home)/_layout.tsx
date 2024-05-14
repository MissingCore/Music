import { Link, Stack, usePathname } from "expo-router";
import { ScrollView, View } from "react-native";

import { cn } from "@/lib/style";

export default function HomeLayout() {
  return (
    <>
      <NavigationBar />
      <Stack screenOptions={{ animation: "fade", headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="playlist" />
        <Stack.Screen name="track" />
        <Stack.Screen name="album" />
        <Stack.Screen name="artist" />
      </Stack>
    </>
  );
}

/** @description List of routes we'll display buttons for on the "home" page. */
const NavRoutes = [
  { href: "/", label: "HOME" },
  { href: "/playlist", label: "PLAYLISTS" },
  { href: "/track", label: "TRACKS" },
  { href: "/album", label: "ALBUMS" },
  { href: "/artist", label: "ARTISTS" },
] as const;

/** @description Custom navigation bar for "home" screen. */
function NavigationBar() {
  const pathname = usePathname();
  return (
    <View className="mt-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        overScrollMode="never"
        contentContainerClassName="ml-2 pr-[25%]"
      >
        {NavRoutes.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "px-2 py-4 font-geistMonoLight text-lg text-foreground50",
              { "text-accent500": pathname === href },
            )}
          >
            {label}
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}
