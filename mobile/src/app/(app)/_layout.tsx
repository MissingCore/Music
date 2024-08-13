import { Link, Stack } from "expo-router";
import { View } from "react-native";

import { Ionicons } from "@/components/icons";
import { useHasNewUpdate } from "@/hooks/useHasNewUpdate";

import { CustomHeader } from "@/components/navigation/header";
import { StyledPressable } from "@/components/ui/pressable";
import { MiniPlayer } from "@/features/playback/components/mini-player";

/** Contains content that doesn't take up the full-screen. */
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
                <StyledPressable forIcon>
                  <View>
                    <Ionicons name="settings-outline" />
                    {newUpdate && (
                      <View className="absolute right-0 top-0 size-2 rounded-full bg-accent500" />
                    )}
                  </View>
                </StyledPressable>
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
