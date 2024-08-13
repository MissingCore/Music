import { Stack } from "expo-router";

import { CustomHeader } from "@/components/navigation/header";

export default function CurrentLayout() {
  return (
    <Stack
      screenOptions={{
        animation: "fade",
        header: CustomHeader,
        headerTitle: "",
      }}
    >
      <Stack.Screen name="playlist/[id]" />
      <Stack.Screen name="album/[id]" />
      <Stack.Screen name="artist/[id]" />
    </Stack>
  );
}
