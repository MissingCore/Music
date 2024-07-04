import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, Stack } from "expo-router";
import { Pressable, View } from "react-native";

import { useHasNewUpdate } from "@/hooks/useHasNewUpdate";

import { Colors } from "@/constants/Styles";
import { CustomHeader } from "@/components/navigation/header";
import { MiniPlayer } from "@/features/playback/components/mini-player";

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
            header: CustomHeader,
            headerRight: () => (
              <Link href="/setting" asChild>
                <Pressable className="p-3 active:opacity-75">
                  <View>
                    <Ionicons
                      name="settings-outline"
                      size={24}
                      color={Colors.foreground50}
                    />
                    {newUpdate && (
                      <View className="absolute right-0 top-0 size-2 rounded-full bg-accent500" />
                    )}
                  </View>
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
