import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ animation: "fade" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="storage" />
      <Stack.Screen name="support" />
      <Stack.Screen name="licenses/index" />
      <Stack.Screen name="licenses/[...id]" />
    </Stack>
  );
}
