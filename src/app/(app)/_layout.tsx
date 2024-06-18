import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, Stack } from "expo-router";
import { Pressable, View } from "react-native";

import { useHasNewUpdate } from "@/hooks/useHasNewUpdate";

import { Colors, FontFamily } from "@/constants/Styles";
import { MiniPlayer } from "@/features/playback/components/MiniPlayer";

/** @description Contains content that doesn't take up the full-screen. */
export default function MainLayout() {
  const { newUpdate } = useHasNewUpdate();

  return (
    <>
      <Stack>
        <Stack.Screen
          name="(home)"
          options={{
            title: "MUSIC",
            headerTitleStyle: { fontFamily: FontFamily.ndot57, fontSize: 32 },
            headerRight: () => (
              <Link href="/setting" asChild>
                <Pressable className="active:opacity-75">
                  <Ionicons
                    name="settings-outline"
                    size={24}
                    color={Colors.foreground50}
                  />
                  {newUpdate && (
                    <View className="absolute right-0 top-0 size-2 rounded-full bg-accent500" />
                  )}
                </Pressable>
              </Link>
            ),
          }}
        />
        <Stack.Screen name="(current)" options={{ headerShown: false }} />
      </Stack>
      <MiniPlayer />
    </>
  );
}
