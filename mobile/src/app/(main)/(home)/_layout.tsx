import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ animation: "fade", headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="folder" />
      <Stack.Screen name="playlist" />
      <Stack.Screen name="track" />
      <Stack.Screen name="album" />
      <Stack.Screen name="artist" />
    </Stack>
  );
}
