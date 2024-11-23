import { Stack } from "expo-router";

import { TopAppBar } from "@/components/new/TopAppBar";

export default function CurrentLayout() {
  return (
    <Stack
      screenOptions={{ animation: "fade", header: TopAppBar, headerTitle: "" }}
    >
      <Stack.Screen name="playlist/[id]" />
      <Stack.Screen name="album/[id]" />
      <Stack.Screen name="artist/[id]" />
    </Stack>
  );
}
