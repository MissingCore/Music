import { Stack } from "expo-router";

import { TopAppBar } from "@/components/TopAppBar";

export default function CurrentLayout() {
  return (
    <Stack
      screenOptions={{ animation: "fade", header: TopAppBar, headerTitle: "" }}
    >
      <Stack.Screen name="playlist/Favorite Tracks" />
      <Stack.Screen name="playlist/create" />
      <Stack.Screen name="playlist/modify" />
      <Stack.Screen name="playlist/[id]" />
      <Stack.Screen name="album/[id]" />
      <Stack.Screen name="artist/[id]" />
    </Stack>
  );
}
