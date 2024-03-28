import { Link, Stack, usePathname } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import Colors from "@/constants/Colors";

export default function HomeLayout() {
  return (
    <>
      <NavigationBar />
      <Stack screenOptions={{ headerShown: false }}>
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
    <View style={styles.navbarContainer}>
      <ScrollView
        contentContainerStyle={styles.navbar}
        horizontal
        showsHorizontalScrollIndicator={false}
        overScrollMode="never"
      >
        {NavRoutes.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            style={[styles.navLink, pathname === href && styles.activeLink]}
          >
            {label}
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  navbarContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  navbar: {
    marginLeft: 8,
    paddingRight: "25%",
  },
  navLink: {
    padding: 8,
    fontFamily: "GeistMonoLight",
    fontSize: 20,
    color: Colors.foreground,
  },
  activeLink: {
    color: Colors.accent,
  },
});
