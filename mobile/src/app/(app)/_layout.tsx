import { Link, Stack } from "expo-router";
import { View } from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";

import { Ionicons } from "@/resources/icons";
import { useHasNewUpdate } from "@/hooks/useHasNewUpdate";

import { CustomHeader } from "@/components/navigation/header";
import { StyledPressable } from "@/components/ui/pressable";
import { MiniPlayer } from "@/modules/media/components";

/** Contains content that doesn't take up the full-screen. */
export default function MainLayout() {
  const { hasNewUpdate } = useHasNewUpdate();

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
                    {hasNewUpdate && (
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

      <Animated.View
        entering={SlideInDown.duration(1000)}
        pointerEvents="box-none"
        className="absolute bottom-0 left-0 w-full p-4 pt-0"
      >
        <MiniPlayer />
      </Animated.View>
    </>
  );
}
