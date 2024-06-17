import { useState } from "react";
import { Dimensions, Text } from "react-native";
import BootSplash from "react-native-bootsplash";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { Colors } from "@/constants/Styles";
import { AnimatedSafeContainer } from "../ui/Container";
import { LoadingTextEllipsis } from "../ui/Loading";

/** @description Screen when we're saving tracks into the database. */
export function AnimatedBootSplash() {
  const [renderMessage, setRenderMessage] = useState(false);

  const { container, logo } = BootSplash.useHideAnimation({
    manifest: require("../../../assets/bootsplash/manifest.json"),
    logo: require("../../../assets/bootsplash/logo.png"),

    animate: () => {
      setTimeout(() => setRenderMessage(true), 3000);
    },
  });

  return (
    <AnimatedSafeContainer {...container} exiting={FadeOut.duration(500)}>
      <Animated.Image {...logo} style={[logo.style]} />

      {renderMessage && (
        <Animated.View
          entering={FadeIn.duration(750)}
          style={{ width: Dimensions.get("window").width - 64 }}
          className="absolute bottom-16 left-8"
        >
          <Text className="mb-2 text-center font-geistMono text-base text-foreground50">
            Saving tracks in progress
            <LoadingTextEllipsis color={Colors.foreground50} />
          </Text>
          <Text className="text-center font-geistMonoLight text-xs text-foreground100">
            This may take a while if you just installed the app or added a lot
            of new tracks.
          </Text>
        </Animated.View>
      )}
    </AnimatedSafeContainer>
  );
}
