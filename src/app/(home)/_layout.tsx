import React from "react";
import { Link, Stack, usePathname } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import Colors from "@/constants/Colors";

export default function TabLayout() {
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

/** @description Custom navigation bar for "home" screen. */
function NavigationBar() {
  return (
    <View style={styles.navbarContainer}>
      <ScrollView
        contentContainerStyle={styles.navbar}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <Link href="/" style={navLinkStyle("/")}>
          HOME
        </Link>
        <Link href="/playlist" style={navLinkStyle("/playlist")}>
          PLAYLISTS
        </Link>
        <Link href="/track" style={navLinkStyle("/track")}>
          TRACKS
        </Link>
        <Link href="/album" style={navLinkStyle("/album")}>
          ALBUMS
        </Link>
        <Link href="/artist" style={navLinkStyle("/artist")}>
          ARTISTS
        </Link>
      </ScrollView>
    </View>
  );
}

/** @description Applies active style. */
function navLinkStyle(href: string) {
  const pathname = usePathname();
  return [styles.navLink, pathname === href && { color: Colors.accent }];
}

const styles = StyleSheet.create({
  navbarContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  navbar: {
    marginLeft: 8,
    paddingRight: 64,
  },
  navLink: {
    padding: 8,
    fontFamily: "GeistMono",
    fontSize: 20,
    color: Colors.foreground,
  },
});
