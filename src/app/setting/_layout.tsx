import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ animation: "fade" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="license" />
      <Stack.Screen name="storage" />
      <Stack.Screen name="support" />
      <Stack.Screen name="third-party/index" />
      <Stack.Screen name="third-party/[id]" />
    </Stack>
  );
}
