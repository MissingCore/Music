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
                <Pressable className="active:opacity-75">
                  <Ionicons
                    name="settings-outline"
                    size={24}
                    color={Colors.foreground50}
                  />
                </Pressable>
              </Link>
            ),
          }}
        />
        <Stack.Screen
          name="(current)"
          options={{ animation: "slide_from_right", headerShown: false }}
        />
      </Stack>
      <MiniPlayer />
    </>
  );
}
