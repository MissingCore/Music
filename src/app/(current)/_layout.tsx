import { Stack } from "expo-router";

export default function CurrentLayout() {
  return (
    <Stack>
      <Stack.Screen name="playlist/[id]" />
      <Stack.Screen name="album/[id]" />
      <Stack.Screen name="artist/[id]" />
    </Stack>
  );
}