import { Stack } from "expo-router";

import { BackButton } from "@/components/BackButton";

export default function CurrentLayout() {
  return (
    <Stack screenOptions={{ headerTitle: "", headerLeft: BackButton }}>
      <Stack.Screen name="playlist/[id]" />
      <Stack.Screen name="album/[id]" />
      <Stack.Screen name="artist/[id]" />
    </Stack>
  );
}
