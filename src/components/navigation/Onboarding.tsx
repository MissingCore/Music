import { Image as ExpoImage } from "expo-image";
import { cssInterop } from "nativewind";
import { Text, View, useWindowDimensions } from "react-native";
import Animated, { clamp, FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/Styles";
import { AnimatedSafeContainer } from "../ui/Container";
import { LoadingTextEllipsis } from "../ui/Loading";

// https://www.nativewind.dev/v4/api/css-interop
const Image = cssInterop(ExpoImage, { className: "style" });

/** @description Screen when we're saving tracks into the database. */
export function Onboarding() {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();

  // Values are ratio for the icon on the splash screen in `splash.png`.
  const iconSize = clamp(0, width * (51 / 214), height * (51 / 463));

  return (
    <AnimatedSafeContainer
      exiting={FadeOut}
      className="absolute inset-0 z-50 bg-canvas"
    >
      <View style={{ height, width }}>
        {/* Get the icon position relatively where the splash screen icon is. */}
        <View style={{ paddingBottom: insets.top }} className="m-auto">
          <Image
            source={require("@/assets/images/splash-icon.png")}
            contentFit="contain"
            style={{ height: iconSize, width: iconSize }}
          />
        </View>

        <Animated.View
          entering={FadeIn.duration(750).delay(3000)}
          style={{ width: width - 64 }}
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
      </View>
    </AnimatedSafeContainer>
  );
}
