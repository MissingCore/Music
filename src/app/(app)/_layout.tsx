import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, Stack } from "expo-router";
import { Pressable } from "react-native";

import Colors from "@/constants/Colors";
import { MiniPlayer } from "@/features/playback/components/MiniPlayer";

/** @description Contains content that doesn't take up the full-screen. */
export default function MainLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="(home)"
          options={{
            title: "MUSIC",
            headerTitleStyle: { fontFamily: "Ndot57", fontSize: 32 },
            headerRight: () => (
              <Link href="/setting" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <Ionicons
                      name="settings-outline"
                      size={24}
                      color={Colors.foreground50}
                      style={{ opacity: pressed ? 0.5 : 1 }}
                    />
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
