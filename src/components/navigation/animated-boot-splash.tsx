import { useAtomValue } from "jotai";
import { useState } from "react";
import { Dimensions, Text, View } from "react-native";
import BootSplash from "react-native-bootsplash";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { indexStatusAtom } from "@/features/indexing/api/index-audio";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { SafeContainer } from "../ui/container";
import { AnimatedTextEllipsis } from "../ui/loading";

const descriptionText = "text-center font-geistMonoLight text-xs";

/** Screen when we're saving tracks into the database. */
export function AnimatedBootSplash() {
  const { errors, previouslyFound, staged, unstaged } =
    useAtomValue(indexStatusAtom);
  const [renderMessage, setRenderMessage] = useState(false);

  const { container, logo } = BootSplash.useHideAnimation({
    manifest: require("../../../assets/bootsplash/manifest.json"),
    logo: require("../../../assets/bootsplash/logo.png"),

    animate: () => {
      setTimeout(() => setRenderMessage(true), 3000);
    },
  });

  return (
    <SafeContainer animated {...container} exiting={FadeOut.duration(500)}>
      <Animated.Image {...logo} style={[logo.style]} />

      {renderMessage && (
        <Animated.View
          entering={FadeIn.duration(750)}
          style={{ width: Dimensions.get("window").width - 64 }}
          className="absolute bottom-16 left-8"
        >
          <View className="mb-2 flex-row items-center justify-center">
            <Text className="font-geistMono text-lg text-foreground50">
              Preparing App
            </Text>
            <AnimatedTextEllipsis
              color={Colors.foreground50}
              textClass="font-geistMono text-lg"
            />
          </View>
          <Text className={cn("text-foreground50", descriptionText)}>
            {staged ?? "—"}/{unstaged ?? "—"} Saved/Updated | {errors ?? "—"}{" "}
            Errors
          </Text>
          <Text className={cn("mb-4 text-surface400", descriptionText)}>
            {previouslyFound ?? "—"} Previously Saved
          </Text>

          <Text className={cn("text-foreground100", descriptionText)}>
            This may take a while depending on the number of new tracks
            discovered or if the app is fixing some data.
          </Text>
        </Animated.View>
      )}
    </SafeContainer>
  );
}
