import { Stack } from "expo-router";

import { BackButton } from "@/components/navigation/back";

export default function CurrentLayout() {
  return (
    <Stack
      screenOptions={{
        animation: "fade",
        headerTitle: "",
        // @ts-expect-error (TS2322) — Props shouldn't be conflicting.
        headerLeft: BackButton,
      }}
    >
      <Stack.Screen name="playlist/[id]" />
      <Stack.Screen name="album/[id]" />
      <Stack.Screen name="artist/[id]" />
    </Stack>
  );
}
